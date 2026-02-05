import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionType,
} from './dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

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
    // Verify contract exists if provided
    if (dto.contractId) {
      const contract = await this.prisma.contract.findUnique({
        where: { id: dto.contractId },
      });

      if (!contract) {
        throw new NotFoundException(
          `Không tìm thấy hợp đồng với ID ${dto.contractId}`,
        );
      }
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
        throw new BadRequestException('Hóa đơn không thuộc về hợp đồng này');
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
    if (dto.type === TransactionType.DEPOSIT && dto.contractId) {
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
    if (transaction.type === 'DEPOSIT' && transaction.contractId) {
      await this.prisma.contract.update({
        where: { id: transaction.contractId },
        data: {
          paidDeposit: {
            decrement: transaction.amount,
          },
        },
      });
    } else if (
      transaction.type === 'INVOICE_PAYMENT' &&
      transaction.invoiceId
    ) {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: transaction.invoiceId },
      });

      if (invoice) {
        const newPaidAmount = Math.max(
          0,
          invoice.paidAmount - transaction.amount,
        );
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

    const [totalDeposit, totalPayment, totalExpense, totalOther] =
      await Promise.all([
        this.prisma.transaction.aggregate({
          where: { ...where, type: 'DEPOSIT' },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, type: 'INVOICE_PAYMENT' },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, type: 'EXPENSE' },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, type: 'OTHER' },
          _sum: { amount: true },
        }),
      ]);

    const income =
      (totalDeposit._sum.amount || 0) + (totalPayment._sum.amount || 0);
    const expense =
      (totalExpense._sum.amount || 0) + (totalOther._sum.amount || 0);

    return {
      income,
      expense,
      net: income - expense,
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

  async getRecentActivity(limit = 10, buildingId?: number) {
    const where: any = {};
    if (buildingId && !isNaN(buildingId)) {
      where.contract = {
        room: { buildingId },
      };
    }

    const [transactions, issues] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contract: {
            include: {
              room: true,
              tenant: true,
            },
          },
        },
      }),
      this.prisma.issue.findMany({
        where: buildingId ? { room: { buildingId } } : {},
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          room: true,
        },
      }),
    ]);

    const activities = [
      ...transactions.map((t) => ({
        id: `t-${t.id}`,
        type: 'PAYMENT',
        title: t.contract
          ? `Phòng ${t.contract.room.name} thanh toán`
          : t.note || 'Phiếu chi / Thu vui',
        amount: t.amount,
        date: t.createdAt,
        roomName: t.contract?.room?.name || 'Tòa nhà',
        unit: 'đ',
      })),
      ...issues.map((i) => ({
        id: `i-${i.id}`,
        type: 'ISSUE',
        title: `P.${i.room.name}: ${i.title}`,
        date: i.createdAt,
        roomName: i.room.name,
        status: i.status,
      })),
    ];

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  /**
   * Process Webhook from SePay
   * Format content: "HD {invoiceId}" or "HD{invoiceId}"
   */
  async processSePayWebhook(payload: any) {
    console.log('SePay Webhook Payload:', payload);

    // 1. Parse content to find Invoice ID
    // Regex matches "HD" followed by optional space and digits
    // Case insensitive
    const regex = /HD\s*(\d+)/i;
    const match = payload.content.match(regex);

    if (!match) {
      console.log('No Invoice ID found in content:', payload.content);
      return { success: false, message: 'No Invoice ID found' };
    }

    const invoiceId = parseInt(match[1], 10);
    console.log('Found Invoice ID:', invoiceId);

    // 2. Find Invoice
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        contract: true,
      },
    });

    if (!invoice) {
      console.log('Invoice not found:', invoiceId);
      return { success: false, message: 'Invoice not found' };
    }

    // 3. Create Transaction
    // Check if transaction already exists (avoid duplicate by sepay id or reference)
    const existingTx = await this.prisma.transaction.findFirst({
      where: {
        note: {
          contains: `SePay Ref: ${payload.referenceCode}`,
        },
      },
    });

    if (existingTx) {
      console.log('Transaction already exists for this payment');
      return { success: true, message: 'Transaction already exists' };
    }

    const code = await this.generateCode();

    await this.prisma.transaction.create({
      data: {
        code,
        amount: payload.transferAmount,
        type: TransactionType.INVOICE_PAYMENT,
        date: new Date(payload.transactionDate), // SePay sends ISO date usually
        note: `Thanh toán qua SePay (Ref: ${payload.referenceCode}) - ${payload.content}`,
        contractId: invoice.contractId,
        invoiceId: invoice.id,
      },
    });

    // 4. Update Invoice Status
    const newPaidAmount = invoice.paidAmount + payload.transferAmount;
    let newStatus = invoice.status;

    if (newPaidAmount >= invoice.totalAmount) {
      newStatus = 'PAID';
    } else if (payload.content.toUpperCase().includes('DEMO')) {
      // DEMO MODE: Treat as full payment regardless of amount
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIAL';
    }

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    return { success: true, message: 'Payment processed successfully' };
  }
}
