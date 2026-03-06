import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus, CalculationType, Prisma } from '@prisma/client';
import {
  GenerateInvoiceDto,
  UpdateInvoiceDto,
  RecordPaymentDto,
  InvoiceLineItem,
  PaymentRecord,
} from './dto';

@Injectable()
export class InvoicesService implements OnModuleInit {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Chạy ngay khi module khởi động để cập nhật hóa đơn quá hạn
   */
  onModuleInit() {
    void this.checkOverdueInvoices();
  }
  /**
   * BƯỚC 1: Xem trước hóa đơn (Preview)
   * - Kiểm tra readings
   * - Tính toán
   * - Trả về JSON lineItems
   */
  async preview(dto: GenerateInvoiceDto) {
    // 1. Validate format tháng
    if (!/^\d{2}-\d{4}$/.test(dto.month)) {
      throw new BadRequestException(
        'Format tháng không hợp lệ. Phải là MM-YYYY',
      );
    }

    // 2. Lấy thông tin hợp đồng
    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
      include: {
        room: { include: { building: true } },
        tenant: true,
      },
    });

    if (!contract) {
      throw new NotFoundException(
        `Không tìm thấy hợp đồng ID: ${dto.contractId}`,
      );
    }

    if (!contract.isActive) {
      throw new BadRequestException(
        'Hợp đồng đã kết thúc, không thể tạo hóa đơn',
      );
    }

    // 2.5 Kiểm tra xem đã có hóa đơn tháng này chưa
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        contractId: dto.contractId,
        month: dto.month,
      },
    });

    if (existingInvoice) {
      throw new ConflictException(
        `Phòng này đã có hóa đơn tháng ${dto.month}. Bấm Xóa hóa đơn cũ trước khi lập lại.`,
      );
    }

    // 3. Khởi tạo line items
    const lineItems: InvoiceLineItem[] = [];

    // ===== TÍNH TIỀN PHÒNG (RENT) =====
    let roomCharge = contract.price;
    let rentNote: string | undefined;

    if (dto.proratedRent) {
      // Tính tiền phòng theo ngày
      const [monthStr, yearStr] = dto.month.split('-');
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);
      const daysInMonth = new Date(year, month, 0).getDate();

      // Ngày bắt đầu tính
      let startDay = dto.startDay ?? contract.startDate.getDate();
      if (startDay > daysInMonth) startDay = daysInMonth;

      const daysStayed = daysInMonth - startDay + 1;
      roomCharge = Math.round((contract.price / daysInMonth) * daysStayed);
      rentNote = `Tính từ ngày ${startDay} (${daysStayed}/${daysInMonth} ngày)`;
    }

    lineItems.push({
      type: 'RENT',
      name: 'Tiền phòng',
      quantity: 1,
      unit: 'tháng',
      unitPrice: contract.price,
      amount: roomCharge,
      note: rentNote,
    });

    // Check readings exist?
    console.log('DEBUG: Querying readings for contract:', dto.contractId, 'month:', dto.month);
    
    // TEMPORARY DEBUG: Remove isBilled filter to see if they exist at all
    const allReadings = await this.prisma.serviceReading.findMany({
      where: {
        contractId: dto.contractId,
        month: dto.month,
      },
      include: { service: true },
    });
    console.log('DEBUG: Found TOTAL readings:', allReadings.length);
    console.log('DEBUG: Readings details:', JSON.stringify(allReadings, null, 2));

    const readings = allReadings.filter(r => !r.isBilled);
    console.log('DEBUG: Filtered unbilled readings:', readings.length);

    const unconfirmedReadings = readings.filter(r => r.isConfirmed === false);
    if (unconfirmedReadings.length > 0) {
      throw new BadRequestException(
        `Tháng ${dto.month} có chỉ số điện/nước của Khách đang chờ duyệt. Vui lòng kiểm tra và duyệt trước khi lập hóa đơn.`,
      );
    }

    // Logic: Nếu có service INDEX mà không tìm thấy reading tương ứng -> Báo lỗi
    const indexServices = await this.prisma.service.findMany({
      where: { type: 'INDEX', isActive: true },
    });

    if (indexServices.length > 0 && allReadings.length === 0) {
         throw new BadRequestException(
           `Chưa chốt điện/nước tháng ${dto.month}. Vui lòng chốt số trước khi lập hóa đơn.`,
         );
    }

    let serviceCharge = 0;

    for (const reading of readings) {
      const amount = reading.totalCost;
      serviceCharge += amount;

      lineItems.push({
        type: reading.service.name.toLowerCase().includes('điện')
          ? 'ELECTRIC'
          : 'WATER',
        name: reading.service.name,
        quantity: reading.usage,
        unit: reading.service.unit,
        unitPrice: reading.unitPrice,
        amount,
        readingId: reading.id,
        serviceId: reading.serviceId,
        note: `Số cũ: ${reading.oldIndex}, Số mới: ${reading.newIndex}`,
      });
    }

    // ===== TÍNH DỊCH VỤ CỐ ĐỊNH (WIFI, RÁC, GỬI XE...) =====
    const fixedServices = await this.prisma.service.findMany({
      where: {
        type: 'FIXED',
        isActive: true,
      },
    });

    for (const service of fixedServices) {
      let quantity = 1;
      let amount = service.price;

      // Tính theo đầu người nếu calculationType = PER_PERSON
      if (service.calculationType === CalculationType.PER_PERSON) {
        quantity = contract.numTenants;
        amount = service.price * quantity;
      }

      serviceCharge += amount;

      lineItems.push({
        type: 'FIXED',
        name: service.name,
        quantity,
        unit: service.unit,
        unitPrice: service.price,
        amount,
        serviceId: service.id,
      });
    }

    // ===== TÍNH NỢ CŨ (PREVIOUS DEBT) =====
    const previousDebt = await this.getUnpaidDebtBefore(
      dto.contractId,
      dto.month,
    );

    if (previousDebt > 0) {
      lineItems.push({
        type: 'DEBT',
        name: 'Nợ tháng trước',
        quantity: 1,
        unitPrice: previousDebt,
        amount: previousDebt,
      });
    }

    // ===== TÍNH TIỀN CỌC CÒN THIẾU (MISSING DEPOSIT) - AUTO COLLECT =====
    // Logic: Nếu cọc đóng chưa đủ -> Truy thu
    const paidDeposit = (contract as any).paidDeposit || 0;
    const missingDeposit = contract.deposit - paidDeposit;

    // Chỉ truy thu nếu > 0 và chưa được truy thu trong các hóa đơn trước (Optional check)
    // Ở đây ta cứ hiện ra, nếu user thấy đã thu rồi thì xóa dòng này đi (Flexible)
    // Hoặc check kỹ hơn:
    // Tuy nhiên, logic Lozido là "Tự động chèn".
    if (missingDeposit > 0) {
      lineItems.push({
        type: 'DEBT', // Hoặc type mới DEPOSIT_COLLECTION nếu FE hỗ trợ
        name: 'Truy thu tiền cọc còn thiếu',
        quantity: 1,
        unit: 'lần',
        unitPrice: missingDeposit,
        amount: missingDeposit,
        note: `Cọc cam kết: ${contract.deposit.toLocaleString()} - Đã đóng: ${paidDeposit.toLocaleString()}`,
      });
    }

    return {
      contract,
      lineItems,
      totalAmount: lineItems.reduce((sum, item) => sum + item.amount, 0),
    };
  }

  /**
   * BƯỚC 2: Tạo hóa đơn nháp (Draft Invoice)
   * - Nếu có dto.lineItems (Snapshot) -> Dùng luôn
   * - Nếu không -> Tự tính (như cũ)
   */
  async generateDraft(dto: GenerateInvoiceDto) {
    // 1. Validate format tháng
    if (!/^\d{2}-\d{4}$/.test(dto.month)) {
      throw new BadRequestException(
        'Format tháng không hợp lệ. Phải là MM-YYYY',
      );
    }

    // 2. Kiểm tra đã có hóa đơn tháng này chưa
    const existing = await this.prisma.invoice.findFirst({
      where: {
        contractId: dto.contractId,
        month: dto.month,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Đã có hóa đơn tháng ${dto.month}. Vui lòng sử dụng API update hoặc xóa hóa đơn cũ.`,
      );
    }

    let lineItems: InvoiceLineItem[] = [];
    let roomCharge = 0;
    let serviceCharge = 0;
    let previousDebt = 0;
    let totalAmount = 0;

    // CASE A: Dùng Snapshot (Recommended)
    if (dto.lineItems && dto.lineItems.length > 0) {
      lineItems = dto.lineItems as unknown as InvoiceLineItem[];

      // Tính toán lại các charge fields từ snapshot để lưu DB
      for (const item of lineItems) {
        if (item.type === 'RENT') roomCharge += item.amount;
        else if (
          item.type === 'ELECTRIC' ||
          item.type === 'WATER' ||
          item.type === 'FIXED'
        )
          serviceCharge += item.amount;
        else if (item.type === 'DEBT') previousDebt += item.amount;
      }
      totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
    }
    // CASE B: Tự tính (Fallback / Bulk)
    else {
      const previewData = await this.preview(dto);
      lineItems = previewData.lineItems;
      totalAmount = previewData.totalAmount;

      // Recalculate charges
      for (const item of lineItems) {
        if (item.type === 'RENT') roomCharge += item.amount;
        else if (
          item.type === 'ELECTRIC' ||
          item.type === 'WATER' ||
          item.type === 'FIXED'
        )
          serviceCharge += item.amount;
        else if (item.type === 'DEBT') previousDebt += item.amount;
      }
    }

    // 5. Tạo hóa đơn nháp
    const invoice = await this.prisma.invoice.create({
      data: {
        contractId: dto.contractId,
        month: dto.month,
        roomCharge,
        serviceCharge,
        extraCharge: 0,
        previousDebt,
        discount: 0,
        totalAmount,
        paidAmount: 0,
        debtAmount: totalAmount,
        status: InvoiceStatus.DRAFT,
        lineItems: lineItems as unknown as Prisma.JsonArray,
        paymentHistory: [],
      },
      include: {
        contract: {
          include: {
            room: { include: { building: true } },
            tenant: true,
          },
        },
      },
    });

    return invoice;
  }

  /**
   * Lấy tổng nợ chưa trả của các tháng TRƯỚC tháng hiện tại
   */
  async getUnpaidDebtBefore(
    contractId: number,
    currentMonth: string,
  ): Promise<number> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        contractId,
        status: {
          in: [
            InvoiceStatus.PUBLISHED,
            InvoiceStatus.PARTIAL,
            InvoiceStatus.OVERDUE,
          ],
        },
      },
    });

    let totalDebt = 0;
    for (const inv of invoices) {
      // Chỉ tính các tháng TRƯỚC tháng hiện tại
      if (this.compareMonths(inv.month, currentMonth) < 0) {
        totalDebt += inv.debtAmount;
      }
    }

    return totalDebt;
  }

  /**
   * So sánh 2 tháng (MM-YYYY format)
   */
  private compareMonths(a: string, b: string): number {
    const [monthA, yearA] = a.split('-').map(Number);
    const [monthB, yearB] = b.split('-').map(Number);
    if (yearA !== yearB) return yearA - yearB;
    return monthA - monthB;
  }

  /**
   * BƯỚC 2: Thêm khoản phát sinh / giảm giá vào hóa đơn (draft)
   * HOẶC: Cập nhật toàn bộ lineItems (Flexible Editing)
   */
  async updateDraft(id: number, dto: UpdateInvoiceDto) {
    const invoice = await this.findOne(id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Chỉ có thể sửa hóa đơn ở trạng thái DRAFT. Vui lòng hủy phát hành trước.',
      );
    }

    let lineItems = (invoice.lineItems as unknown as InvoiceLineItem[]) || [];

    // Fallback: Nếu lineItems rỗng (do data cũ/seed), ta phục hồi lại Tiền phòng và Dịch vụ
    if (lineItems.length === 0) {
      if (invoice.roomCharge > 0) {
        lineItems.push({
          type: 'RENT',
          name: 'Tiền phòng',
          amount: invoice.roomCharge,
          quantity: 1,
          unit: 'tháng',
          unitPrice: invoice.roomCharge,
        });
      }
      if (invoice.serviceCharge > 0) {
        lineItems.push({
          type: 'FIXED', // Gộp chung dịch vụ
          name: 'Dịch vụ & Phí khác',
          amount: invoice.serviceCharge,
          quantity: 1,
          unit: 'gói',
          unitPrice: invoice.serviceCharge,
        });
      }
      if (invoice.previousDebt > 0) {
        lineItems.push({
          type: 'DEBT',
          name: 'Nợ cũ',
          amount: invoice.previousDebt,
          quantity: 1,
          unitPrice: invoice.previousDebt,
        });
      }
    }
    let roomCharge = invoice.roomCharge;
    let serviceCharge = invoice.serviceCharge;
    let extraCharge = invoice.extraCharge;
    let discount = dto.discount ?? invoice.discount;
    let previousDebt = invoice.previousDebt;

    // CASE 1: Flexible Editing (Gửi toàn bộ lineItems mới)
    if (dto.lineItems) {
      lineItems = dto.lineItems as unknown as InvoiceLineItem[];

      // Recalculate charges based on types
      roomCharge = 0;
      serviceCharge = 0;
      extraCharge = 0;
      previousDebt = 0;
      discount = 0; // Reset discount, will be calculated from items if type is DISCOUNT

      for (const item of lineItems) {
        if (item.type === 'RENT') roomCharge += item.amount;
        else if (
          item.type === 'ELECTRIC' ||
          item.type === 'WATER' ||
          item.type === 'FIXED'
        )
          serviceCharge += item.amount;
        else if (item.type === 'EXTRA') extraCharge += item.amount;
        else if (item.type === 'DEBT') previousDebt += item.amount;
        else if (item.type === 'DISCOUNT') discount += Math.abs(item.amount); // Discount item usually has negative amount or positive? Let's assume negative in amount, but we store positive in DB field
      }

      // Note: If DISCOUNT item exists, its amount should be negative in lineItems to reduce total.
      // But in DB field `discount`, we usually store positive value.
      // Let's ensure consistency.
    }
    // CASE 2: Legacy (Chỉ thêm extraCharges hoặc update discount)
    else {
      // Xóa các khoản EXTRA và DISCOUNT cũ nếu update theo kiểu cũ
      // (Logic cũ giữ nguyên hoặc merge? Ở đây ta giữ logic cũ là replace extraCharges)

      const filteredItems = lineItems.filter(
        (item) => item.type !== 'EXTRA' && item.type !== 'DISCOUNT',
      );

      // Thêm các khoản phát sinh mới
      extraCharge = 0;
      if (dto.extraCharges && dto.extraCharges.length > 0) {
        for (const extra of dto.extraCharges) {
          extraCharge += extra.amount;
          filteredItems.push({
            type: 'EXTRA',
            name: extra.name,
            quantity: 1,
            unitPrice: extra.amount,
            amount: extra.amount,
            note: extra.note,
          });
        }
      }

      // Thêm giảm giá nếu có
      if (discount > 0) {
        filteredItems.push({
          type: 'DISCOUNT',
          name: 'Giảm giá',
          quantity: 1,
          unitPrice: -discount,
          amount: -discount,
        });
      }

      lineItems = filteredItems;
    }

    // Tính lại tổng
    // Total = Sum of all line items
    const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const debtAmount = totalAmount - invoice.paidAmount;

    return this.prisma.invoice.update({
      where: { id },
      data: {
        roomCharge,
        serviceCharge,
        extraCharge,
        previousDebt,
        discount,
        totalAmount,
        debtAmount,
        lineItems: lineItems as unknown as Prisma.JsonArray,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : invoice.dueDate,
        note: dto.note ?? invoice.note,
      },
      include: {
        contract: {
          include: {
            room: { include: { building: true } },
            tenant: true,
          },
        },
      },
    });
  }

  /**
   * BƯỚC 3: Phát hành hóa đơn (Publish)
   * - Chuyển trạng thái từ DRAFT -> PUBLISHED
   * - Đánh dấu các readings đã được bill
   * - Snapshot dữ liệu (đã làm khi generate)
   */
  async publish(id: number) {
    const invoice = await this.findOne(id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Chỉ có thể phát hành hóa đơn ở trạng thái DRAFT',
      );
    }

    // Đánh dấu các readings đã bill
    const lineItems = invoice.lineItems as unknown as InvoiceLineItem[];
    const readingIds = lineItems
      .filter((item) => item.readingId)
      .map((item) => item.readingId as number);

    await this.prisma.$transaction([
      // Cập nhật invoice
      this.prisma.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      }),
      // Đánh dấu readings đã bill
      this.prisma.serviceReading.updateMany({
        where: { id: { in: readingIds } },
        data: { isBilled: true, invoiceId: id },
      }),
    ]);

    return this.findOne(id);
  }

  /**
   * Hủy phát hành (Unpublish) - Chuyển về DRAFT
   */
  async unpublish(id: number) {
    const invoice = await this.findOne(id);

    if (invoice.status !== InvoiceStatus.PUBLISHED) {
      throw new BadRequestException(
        'Chỉ có thể hủy phát hành hóa đơn ở trạng thái PUBLISHED',
      );
    }

    // Bỏ đánh dấu các readings
    const lineItems = invoice.lineItems as unknown as InvoiceLineItem[];
    const readingIds = lineItems
      .filter((item) => item.readingId)
      .map((item) => item.readingId as number);

    await this.prisma.$transaction([
      this.prisma.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.DRAFT,
          publishedAt: null,
        },
      }),
      this.prisma.serviceReading.updateMany({
        where: { id: { in: readingIds } },
        data: { isBilled: false, invoiceId: null },
      }),
    ]);

    return this.findOne(id);
  }

  /**
   * BƯỚC 5: Ghi nhận thanh toán (Record Payment)
   */
  async recordPayment(id: number, dto: RecordPaymentDto) {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Không thể ghi nhận thanh toán cho hóa đơn DRAFT. Vui lòng phát hành trước.',
      );
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Hóa đơn đã được thanh toán đầy đủ');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Không thể thanh toán hóa đơn đã hủy');
    }

    // Tính toán
    const newPaidAmount = invoice.paidAmount + dto.amount;
    const newDebtAmount = invoice.totalAmount - newPaidAmount;

    // Xác định trạng thái mới
    let newStatus: InvoiceStatus = invoice.status;
    if (newDebtAmount <= 0) {
      newStatus = InvoiceStatus.PAID;
    } else if (newPaidAmount > 0) {
      newStatus = InvoiceStatus.PARTIAL;
    }

    // Thêm vào payment history
    const paymentHistory =
      (invoice.paymentHistory as unknown as PaymentRecord[]) || [];
    paymentHistory.push({
      date: dto.paymentDate || new Date().toISOString(),
      amount: dto.amount,
      method: dto.method,
      note: dto.note,
      receivedBy: dto.receivedBy,
    });

    // Transaction: Tạo phiếu thu + Cập nhật Invoice
    return this.prisma.$transaction(async (tx) => {
      // 1. Tạo Transaction
      await tx.transaction.create({
        data: {
          code: `PT-${Date.now()}`,
          amount: dto.amount,
          type: 'INVOICE_PAYMENT',
          contractId: invoice.contractId,
          invoiceId: invoice.id,
          note: dto.note || `Thanh toán hóa đơn tháng ${invoice.month}`,
          date: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        },
      });

      // 2. Update Invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          debtAmount: Math.max(0, newDebtAmount),
          status: newStatus,
          paymentHistory: paymentHistory as unknown as Prisma.JsonArray,
        },
        include: {
          contract: {
            include: {
              room: { include: { building: true } },
              tenant: true,
            },
          },
        },
      });

      // 3. Update Contract Paid Deposit if this was a Deposit Collection invoice
      // Only if fully paid to avoid complexity with partial payments for now
      if (newStatus === InvoiceStatus.PAID) {
        const lineItems = invoice.lineItems as unknown as any[];
        const depositItem = lineItems.find(
          (item) =>
            item.name === 'Truy thu tiền cọc còn thiếu' || item.type === 'DEBT',
        );

        if (depositItem) {
          await tx.contract.update({
            where: { id: invoice.contractId },
            data: {
              paidDeposit: {
                increment: depositItem.amount,
              },
            },
          });
        }
      }

      return updatedInvoice;
    });
  }

  /**
   * Hủy hóa đơn
   */
  async cancel(id: number) {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Không thể hủy hóa đơn đã thanh toán');
    }

    // Bỏ đánh dấu các readings nếu đã publish
    if (invoice.status !== InvoiceStatus.DRAFT) {
      const lineItems = invoice.lineItems as unknown as InvoiceLineItem[];
      const readingIds = lineItems
        .filter((item) => item.readingId)
        .map((item) => item.readingId as number);

      await this.prisma.serviceReading.updateMany({
        where: { id: { in: readingIds } },
        data: { isBilled: false, invoiceId: null },
      });
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED },
      include: {
        contract: {
          include: {
            room: { include: { building: true } },
            tenant: true,
          },
        },
      },
    });
  }

  /**
   * Lấy chi tiết hóa đơn
   */
  async findOne(id: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            room: { include: { building: true } },
            tenant: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Không tìm thấy hóa đơn ID: ${id}`);
    }

    return invoice;
  }

  /**
   * Lấy hóa đơn theo access code (Public)
   */
  async findByAccessCode(code: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { accessCode: code },
      include: {
        contract: {
          include: {
            room: { include: { building: true } },
            tenant: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Không tìm thấy hóa đơn với mã: ${code}`);
    }

    return invoice;
  }

  /**
   * Lấy hóa đơn theo hợp đồng
   */
  async findByContract(contractId: number) {
    return this.prisma.invoice.findMany({
      where: { contractId },
      orderBy: { month: 'desc' },
      include: {
        contract: {
          include: {
            room: { include: { building: true } },
            tenant: true,
          },
        },
      },
    });
  }

  /**
   * Lấy hóa đơn theo tháng (tất cả hợp đồng)
   */
  async findByMonth(month: string, buildingId?: number) {
    const where: Prisma.InvoiceWhereInput = { month };
    if (buildingId) {
      where.contract = {
        room: { buildingId },
      };
    }
    return this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        contract: {
          include: {
            room: { include: { building: true } },
            tenant: true,
          },
        },
      },
    });
  }

  /**
   * Lấy tất cả hóa đơn (có filter)
   */
  async findAll(filters?: {
    status?: InvoiceStatus;
    month?: string;
    buildingId?: number;
    contractId?: number;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.month) {
      where.month = filters.month;
    }

    if (filters?.contractId) {
      where.contractId = filters.contractId;
    }

    if (filters?.buildingId) {
      where.contract = {
        room: {
          buildingId: filters.buildingId,
        },
      };
    }

    return this.prisma.invoice.findMany({
      where,
      orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
      include: {
        contract: {
          include: {
            room: { include: { building: true } },
            tenant: true,
          },
        },
      },
    });
  }

  /**
   * Xóa hóa đơn (chỉ DRAFT hoặc CANCELLED)
   */
  async remove(id: number) {
    const invoice = await this.findOne(id);

    if (
      invoice.status !== InvoiceStatus.DRAFT &&
      invoice.status !== InvoiceStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Chỉ có thể xóa hóa đơn ở trạng thái DRAFT hoặc CANCELLED',
      );
    }

    return this.prisma.invoice.delete({ where: { id } });
  }

  /**
   * Thống kê hóa đơn theo tháng
   */
  async getMonthlyStats(month: string, buildingId?: number) {
    const where: Prisma.InvoiceWhereInput = { month };
    if (buildingId) {
      where.contract = {
        room: { buildingId },
      };
    }

    const previousMonth = this.getPreviousMonth(month);

    const [invoices, prevInvoices] = await Promise.all([
      this.prisma.invoice.findMany({ where }),
      this.prisma.invoice.findMany({
        where: {
          ...where,
          month: previousMonth,
        },
      }),
    ]);

    const stats = {
      month,
      previousMonth,
      totalInvoices: invoices.length,
      byStatus: {
        draft: 0,
        published: 0,
        partial: 0,
        paid: 0,
        overdue: 0,
        cancelled: 0,
      },
      totalAmount: 0, // Tổng doanh thu dự kiến (là tổng giá trị hóa đơn)
      totalPaid: 0,   // Thực thu
      totalDebt: 0,   // Còn nợ
      breakdown: {
        rent: 0,
        services: 0,
        other: 0,
      },
      growth: 0,
    };

    for (const inv of invoices) {
      const statusKey = inv.status.toLowerCase() as keyof typeof stats.byStatus;
      if (stats.byStatus[statusKey] !== undefined) {
        stats.byStatus[statusKey]++;
      }
      stats.totalAmount += inv.totalAmount;
      stats.totalPaid += inv.paidAmount;
      stats.totalDebt += inv.debtAmount;

      stats.breakdown.rent += inv.roomCharge || 0;
      stats.breakdown.services += inv.serviceCharge || 0;
      stats.breakdown.other += (inv.extraCharge || 0) + (inv.previousDebt || 0);
    }

    // Calculate Growth
    let prevTotal = 0;
    for (const inv of prevInvoices) {
      prevTotal += inv.totalAmount;
    }

    if (prevTotal > 0) {
      stats.growth = ((stats.totalAmount - prevTotal) / prevTotal) * 100;
    } else if (stats.totalAmount > 0) {
      stats.growth = 100; // Tăng trưởng từ 0 lên có doanh thu
    }

    return stats;
  }

  private getPreviousMonth(month: string): string {
    if (!month) return '';
    const [m, y] = month.split('-').map(Number);
    let prevM = m - 1;
    let prevY = y;
    if (prevM === 0) {
      prevM = 12;
      prevY = y - 1;
    }
    return `${String(prevM).padStart(2, '0')}-${prevY}`;
  }

  /**
   * Tạo hóa đơn hàng loạt cho tất cả hợp đồng active
   */
  async generateBulkDrafts(month: string) {
    const activeContracts = await this.prisma.contract.findMany({
      where: { isActive: true },
    });

    const results: Array<
      | { success: true; contractId: number; invoiceId: number }
      | { success: false; contractId: number; error: string }
    > = [];

    for (const contract of activeContracts) {
      try {
        const invoice = await this.generateDraft({
          contractId: contract.id,
          month,
        });
        results.push({
          success: true,
          contractId: contract.id,
          invoiceId: invoice.id,
        });
      } catch (error) {
        results.push({
          success: false,
          contractId: contract.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      month,
      total: activeContracts.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      details: results,
    };
  }

  /**
   * Tự động kiểm tra và cập nhật hóa đơn quá hạn (Chạy mỗi ngày lúc nửa đêm)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkOverdueInvoices() {
    this.logger.log('Bắt đầu chạy Cron Job kiểm tra Hóa đơn quá hạn...');

    const now = new Date();

    try {
      // Bước 1: Khôi phục các hóa đơn OVERDUE có trả 1 phần về PARTIAL
      // (trường hợp bị đánh nhầm OVERDUE khi đã có thanh toán 1 phần)
      const restored = await this.prisma.invoice.updateMany({
        where: {
          status: InvoiceStatus.OVERDUE,
          paidAmount: { gt: 0 },
          debtAmount: { gt: 0 },
        },
        data: {
          status: InvoiceStatus.PARTIAL,
        },
      });

      if (restored.count > 0) {
        this.logger.warn(`Đã khôi phục ${restored.count} hóa đơn bị đánh nhầm OVERDUE về PARTIAL.`);
      }

      // Bước 2: Chỉ đánh OVERDUE các hóa đơn PUBLISHED (chưa trả đồng nào) đã quá hạn
      const result = await this.prisma.invoice.updateMany({
        where: {
          status: {
            in: [InvoiceStatus.PUBLISHED], // PARTIAL không tính quá hạn - nợ chuyển qua tháng sau
          },
          debtAmount: {
            gt: 0,
          },
          dueDate: {
            lt: now,
          },
        },
        data: {
          status: InvoiceStatus.OVERDUE,
        },
      });

      if (result.count > 0) {
        this.logger.warn(`Đã cập nhật ${result.count} hóa đơn thành QUÁ HẠN (OVERDUE).`);
      } else {
        this.logger.log('Không có hóa đơn nào quá hạn hôm nay.');
      }
    } catch (error) {
      this.logger.error('Lỗi khi chạy Cron Job checkOverdueInvoices:', error);
    }
  }
}
