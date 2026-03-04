import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { RecordPaymentDto } from './dto';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordPayment', () => {
    const mockInvoiceId = 1;
    const mockDto: RecordPaymentDto = {
      amount: 1000000,
      method: 'CASH',
      paymentDate: new Date().toISOString(),
      note: 'Test payment',
      receivedBy: 'Admin',
    };

    it('should throw NotFoundException if invoice not found', async () => {
      // Arrange
      prisma.invoice.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.recordPayment(mockInvoiceId, mockDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if invoice is DRAFT', async () => {
      // Arrange
      prisma.invoice.findUnique.mockResolvedValue({ id: 1, status: InvoiceStatus.DRAFT } as any);

      // Act & Assert
      await expect(service.recordPayment(mockInvoiceId, mockDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if invoice is PAID', async () => {
      // Arrange
      prisma.invoice.findUnique.mockResolvedValue({ id: 1, status: InvoiceStatus.PAID } as any);

      await expect(service.recordPayment(mockInvoiceId, mockDto)).rejects.toThrow(BadRequestException);
    });

    it('should update status to PARTIAL if paid amount is less than total', async () => {
      // Arrange
      const mockInvoice = {
        id: 1,
        status: InvoiceStatus.PUBLISHED,
        paidAmount: 0,
        totalAmount: 3000000, // Total 3tr
        paymentHistory: [],
      } as any;
      prisma.invoice.findUnique.mockResolvedValue(mockInvoice);

      // Mock transaction
      let transactionCallbackParams: any;
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma as any);
      });

      // Mock update to return updated object
      const expectedUpdatedInvoice = {
        ...mockInvoice,
        paidAmount: 1000000,
        debtAmount: 2000000,
        status: InvoiceStatus.PARTIAL,
      };
      prisma.invoice.update.mockResolvedValue(expectedUpdatedInvoice as any);

      // Act
      const result = await service.recordPayment(mockInvoiceId, mockDto);

      // Assert
      expect(result.status).toBe(InvoiceStatus.PARTIAL);
      expect(result.paidAmount).toBe(1000000);
      expect(result.debtAmount).toBe(2000000);

      // Verify transaction table got inserted
      expect(prisma.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          amount: 1000000,
          type: 'INVOICE_PAYMENT',
        })
      }));
    });

    it('should update status to PAID if paid amount covers total', async () => {
        // Arrange
        const mockInvoice = {
          id: 1,
          contractId: 100,
          status: InvoiceStatus.PUBLISHED,
          paidAmount: 0,
          totalAmount: 1000000, // Total 1tr, pay 1tr
          paymentHistory: [],
          lineItems: [], 
        } as any;
        prisma.invoice.findUnique.mockResolvedValue(mockInvoice);
  
        prisma.$transaction.mockImplementation(async (callback) => {
          return callback(prisma as any);
        });
  
        const expectedUpdatedInvoice = {
          ...mockInvoice,
          paidAmount: 1000000,
          debtAmount: 0,
          status: InvoiceStatus.PAID,
        };
        prisma.invoice.update.mockResolvedValue(expectedUpdatedInvoice as any);
  
        // Act
        const result = await service.recordPayment(mockInvoiceId, mockDto);
  
        // Assert
        expect(result.status).toBe(InvoiceStatus.PAID);
        expect(result.debtAmount).toBe(0);
    });
  });
});
