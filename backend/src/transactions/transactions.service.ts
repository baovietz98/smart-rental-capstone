import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionType } from './dto';

@Injectable()
export class TransactionsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Generate unique transaction code (PT-0001, PT-0002, etc.)
     */
    private async generateCode(): Promise<string> {
        const lastTransaction = await this.prisma.transaction.findFirst({
            orderBy: { id: 'desc' },
            select: { code: true },
        });

        if (!lastTransaction) {
            return 'PT-0001';
        }

        const lastNumber = parseInt(lastTransaction.code.split('-')[1], 10);
        const newNumber = lastNumber + 1;
        return `PT-${newNumber.toString().padStart(4, '0')}`;
    }

    async create(dto: CreateTransactionDto) {
        // Verify contract exists
        const contract = await this.prisma.contract.findUnique({
            where: { id: dto.contractId },
        });

        if (!contract) {
            throw new NotFoundException(
                `Không tìm thấy hợp đồng với ID ${dto.contractId}`,
            );
        }

        // If invoice payment, verify invoice exists
        if (dto.invoiceId) {
            const invoice = await this.prisma.invoice.findUnique({
                where: { id: dto.invoiceId },
            });

            if (!invoice) {
                throw new NotFoundException(
                    `Không tìm thấy hóa đơn với ID ${dto.invoiceId}`,
                );
            }

            if (invoice.contractId !== dto.contractId) {
                throw new BadRequestException(
                    'Hóa đơn không thuộc về hợp đồng này',
                );
            }
        }

        const code = await this.generateCode();

        const transaction = await this.prisma.transaction.create({
            data: {
                code,
                amount: dto.amount,
                type: dto.type,
                date: dto.date ? new Date(dto.date) : new Date(),
                note: dto.note,
                contractId: dto.contractId,
                invoiceId: dto.invoiceId,
            },
            include: {
                contract: {
                    include: {
                        room: true,
                        tenant: true,
                    },
                },
                invoice: true,
            },
        });

        // Update related entities based on transaction type
        if (dto.type === TransactionType.DEPOSIT) {
            // Update paidDeposit in contract
            await this.prisma.contract.update({
                where: { id: dto.contractId },
                data: {
                    paidDeposit: {
                        increment: dto.amount,
                    },
                },
            });
        } else if (dto.type === TransactionType.INVOICE_PAYMENT && dto.invoiceId) {
            // Update paidAmount in invoice
            const invoice = await this.prisma.invoice.findUnique({
                where: { id: dto.invoiceId },
            });

            if (invoice) {
                const newPaidAmount = invoice.paidAmount + dto.amount;
                let newStatus = invoice.status;

                if (newPaidAmount >= invoice.totalAmount) {
                    newStatus = 'PAID';
                } else if (newPaidAmount > 0) {
                    newStatus = 'PARTIAL';
                }

                await this.prisma.invoice.update({
                    where: { id: dto.invoiceId },
                    data: {
                        paidAmount: newPaidAmount,
                        status: newStatus,
                    },
                });
            }
        }

        return transaction;
    }

    async findAll(filters?: {
        type?: TransactionType;
        contractId?: number;
        invoiceId?: number;
        fromDate?: string;
        toDate?: string;
    }) {
        const where: any = {};

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.contractId) {
            where.contractId = filters.contractId;
        }

        if (filters?.invoiceId) {
            where.invoiceId = filters.invoiceId;
        }

        if (filters?.fromDate || filters?.toDate) {
            where.date = {};
            if (filters.fromDate) {
                where.date.gte = new Date(filters.fromDate);
            }
            if (filters.toDate) {
                where.date.lte = new Date(filters.toDate);
            }
        }

        return this.prisma.transaction.findMany({
            where,
            include: {
                contract: {
                    include: {
                        room: {
                            include: {
                                building: true,
                            },
                        },
                        tenant: true,
                    },
                },
                invoice: true,
            },
            orderBy: {
                date: 'desc',
            },
        });
    }

    async findOne(id: number) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            include: {
                contract: {
                    include: {
                        room: {
                            include: {
                                building: true,
                            },
                        },
                        tenant: true,
                    },
                },
                invoice: true,
            },
        });

        if (!transaction) {
            throw new NotFoundException(`Không tìm thấy giao dịch với ID ${id}`);
        }

        return transaction;
    }

    async findByCode(code: string) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { code },
            include: {
                contract: {
                    include: {
                        room: true,
                        tenant: true,
                    },
                },
                invoice: true,
            },
        });

        if (!transaction) {
            throw new NotFoundException(`Không tìm thấy giao dịch với mã ${code}`);
        }

        return transaction;
    }

    async update(id: number, dto: UpdateTransactionDto) {
        await this.findOne(id); // Verify exists

        return this.prisma.transaction.update({
            where: { id },
            data: {
                amount: dto.amount,
                date: dto.date ? new Date(dto.date) : undefined,
                note: dto.note,
            },
            include: {
                contract: {
                    include: {
                        room: true,
                        tenant: true,
                    },
                },
                invoice: true,
            },
        });
    }

    async remove(id: number) {
        const transaction = await this.findOne(id);

        // Reverse the effects if needed
        if (transaction.type === 'DEPOSIT') {
            await this.prisma.contract.update({
                where: { id: transaction.contractId },
                data: {
                    paidDeposit: {
                        decrement: transaction.amount,
                    },
                },
            });
        } else if (transaction.type === 'INVOICE_PAYMENT' && transaction.invoiceId) {
            const invoice = await this.prisma.invoice.findUnique({
                where: { id: transaction.invoiceId },
            });

            if (invoice) {
                const newPaidAmount = Math.max(0, invoice.paidAmount - transaction.amount);
                let newStatus = invoice.status;

                if (newPaidAmount === 0) {
                    newStatus = 'PUBLISHED';
                } else if (newPaidAmount < invoice.totalAmount) {
                    newStatus = 'PARTIAL';
                }

                await this.prisma.invoice.update({
                    where: { id: transaction.invoiceId },
                    data: {
                        paidAmount: newPaidAmount,
                        status: newStatus,
                    },
                });
            }
        }

        return this.prisma.transaction.delete({
            where: { id },
        });
    }

    async getStats(fromDate?: string, toDate?: string) {
        const where: any = {};

        if (fromDate || toDate) {
            where.date = {};
            if (fromDate) where.date.gte = new Date(fromDate);
            if (toDate) where.date.lte = new Date(toDate);
        }

        const [totalDeposit, totalPayment, totalOther, transactions] =
            await Promise.all([
                this.prisma.transaction.aggregate({
                    where: { ...where, type: 'DEPOSIT' },
                    _sum: { amount: true },
                    _count: true,
                }),
                this.prisma.transaction.aggregate({
                    where: { ...where, type: 'INVOICE_PAYMENT' },
                    _sum: { amount: true },
                    _count: true,
                }),
                this.prisma.transaction.aggregate({
                    where: { ...where, type: 'OTHER' },
                    _sum: { amount: true },
                    _count: true,
                }),
                this.prisma.transaction.count({ where }),
            ]);

        return {
            total: transactions,
            deposit: {
                count: totalDeposit._count,
                amount: totalDeposit._sum.amount || 0,
            },
            invoicePayment: {
                count: totalPayment._count,
                amount: totalPayment._sum.amount || 0,
            },
            other: {
                count: totalOther._count,
                amount: totalOther._sum.amount || 0,
            },
            totalAmount:
                (totalDeposit._sum.amount || 0) +
                (totalPayment._sum.amount || 0) +
                (totalOther._sum.amount || 0),
        };
    }

    async findByContract(contractId: number) {
        return this.prisma.transaction.findMany({
            where: { contractId },
            include: {
                invoice: true,
            },
            orderBy: { date: 'desc' },
        });
    }
}
