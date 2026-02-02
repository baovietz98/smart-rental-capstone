import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Tag,
  Table,
  message,
  Form,
  Input,
  InputNumber,
  Popconfirm,
} from "antd";
import {
  Printer,
  Share2,
  Edit,
  CheckCircle,
  Send,
  Trash2,
  Plus,
} from "lucide-react";
import { Invoice, InvoiceStatus, InvoiceLineItem } from "@/types/invoice";
import { invoicesApi } from "@/lib/api/invoices";
import PaymentModal from "./PaymentModal";
import dayjs from "dayjs";

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onCancel: () => void;
  invoice: Invoice | null;
  onUpdate: () => void;
}

export default function InvoiceDetailModal({
  isOpen,
  onCancel,
  invoice,
  onUpdate,
}: InvoiceDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen && invoice) {
      setIsEditing(false);
      // Prepare form data for editing
      const extraCharges = invoice.lineItems
        .filter((item) => item.type === "EXTRA")
        .map((item) => ({
          name: item.name,
          amount: item.amount,
          note: item.note,
        }));

      form.setFieldsValue({
        extraCharges,
        discount: invoice.discount,
        note: invoice.note,
        dueDate: invoice.dueDate ? dayjs(invoice.dueDate) : null,
      });
    }
  }, [isOpen, invoice, form]);

  if (!invoice) return null;

  const handlePublish = async () => {
    try {
      setLoading(true);
      await invoicesApi.publish(invoice.id);
      message.success("Đã phát hành hóa đơn! 📢");
      onUpdate();
    } catch {
      message.error("Lỗi khi phát hành");
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setLoading(true);
      await invoicesApi.unpublish(invoice.id);
      message.success("Đã hủy phát hành! 🔙");
      onUpdate();
    } catch {
      message.error("Lỗi khi hủy phát hành");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await invoicesApi.updateDraft(invoice.id, {
        extraCharges: values.extraCharges,
        discount: values.discount,
        note: values.note,
        dueDate: values.dueDate?.toISOString(),
      });
      message.success("Đã cập nhật hóa đơn! 💾");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  // ... existing code ...
  const displayItems =
    invoice.lineItems && invoice.lineItems.length > 0
      ? invoice.lineItems
      : ([
          {
            name: "Tiền phòng",
            amount: invoice.roomCharge,
            quantity: 1,
            unit: "tháng",
            unitPrice: invoice.roomCharge,
            type: "ROOM",
          },
          ...(invoice.serviceCharge > 0
            ? [
                {
                  name: "Dịch vụ & Phí khác",
                  amount: invoice.serviceCharge,
                  quantity: 1,
                  unit: "gói",
                  unitPrice: invoice.serviceCharge,
                  type: "SERVICE",
                },
              ]
            : []),
        ] as InvoiceLineItem[]);

  const columns = [
    {
      title: "Khoản mục",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: InvoiceLineItem) => (
        <div>
          <div className="font-bold">{text}</div>
          {record.note && (
            <div className="text-xs text-gray-500">{record.note}</div>
          )}
        </div>
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      align: "right" as const,
      render: (val: number) => val?.toLocaleString() || "0",
    },
    {
      title: "SL",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
      render: (val: number, record: InvoiceLineItem) =>
        val ? `${val} ${record.unit || ""}` : "-",
    },
    {
      title: "Thành tiền",
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      render: (val: number) => (
        <span className="font-bold">{val?.toLocaleString()}</span>
      ),
    },
  ];

  const isDraft = invoice.status === InvoiceStatus.DRAFT;
  const isPaid = invoice.status === InvoiceStatus.PAID;

  return (
    <>
      <Modal
        open={isOpen}
        onCancel={onCancel}
        width={900}
        footer={null}
        className="gumroad-modal"
        closeIcon={
          <span className="text-xl font-bold border-2 border-black w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white transition-colors">
            ✕
          </span>
        }
      >
        <div className="p-6 relative overflow-hidden">
          {/* STAMP */}
          {isPaid && (
            <div className="absolute top-10 right-10 transform rotate-12 border-4 border-green-600 text-green-600 text-6xl font-black p-4 opacity-80 pointer-events-none z-10">
              ĐÃ THANH TOÁN
            </div>
          )}

          {/* HEADER */}
          <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tight mb-2">
                Hóa Đơn Tiền Nhà
              </h2>
              <div className="text-xl font-bold text-gray-600">
                Tháng {invoice.month}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-500 uppercase">
                Mã HĐ
              </div>
              <div className="text-2xl font-black">#{invoice.id}</div>
              <Tag
                color={
                  invoice.status === "PAID"
                    ? "green"
                    : invoice.status === "DRAFT"
                      ? "default"
                      : invoice.status === "OVERDUE"
                        ? "red"
                        : "blue"
                }
                className="mt-2 text-lg py-1 px-3 border-2 border-black font-bold"
              >
                {invoice.status}
              </Tag>
            </div>
          </div>

          {/* INFO */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-yellow-50 p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              <h3 className="font-black uppercase mb-2 border-b-2 border-black inline-block">
                Thông tin phòng
              </h3>
              <div className="grid grid-cols-[100px_1fr] gap-2 font-mono text-sm">
                <span className="font-bold text-gray-500">Phòng:</span>
                <span className="font-bold">{invoice.contract?.room.name}</span>
                <span className="font-bold text-gray-500">Tòa nhà:</span>
                <span>{invoice.contract?.room.building.name}</span>
                <span className="font-bold text-gray-500">Khách thuê:</span>
                <span>{invoice.contract?.tenant.name}</span>
                <span className="font-bold text-gray-500">SĐT:</span>
                <span>{invoice.contract?.tenant.phone}</span>
              </div>
            </div>
            <div className="bg-blue-50 p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              <h3 className="font-black uppercase mb-2 border-b-2 border-black inline-block">
                Thanh toán
              </h3>
              <div className="grid grid-cols-[100px_1fr] gap-2 font-mono text-sm">
                <span className="font-bold text-gray-500">Tổng tiền:</span>
                <span className="font-black text-xl">
                  {invoice.totalAmount.toLocaleString()} đ
                </span>
                <span className="font-bold text-gray-500">Đã trả:</span>
                <span className="text-green-600 font-bold">
                  {invoice.paidAmount.toLocaleString()} đ
                </span>
                <span className="font-bold text-gray-500">Còn nợ:</span>
                <span className="text-red-600 font-black text-lg">
                  {invoice.debtAmount.toLocaleString()} đ
                </span>
              </div>
            </div>
          </div>

          {/* PAYMENT QR (New Section) */}
          {!isPaid && invoice.debtAmount > 0 && (
            <div className="bg-indigo-50 p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] mb-8 flex gap-6 items-center">
              <div className="bg-white p-2 border-2 border-black shrink-0">
                <img
                  src={`https://img.vietqr.io/image/TCB-1998199815-compact2.png?amount=${invoice.debtAmount}&addInfo=${encodeURIComponent(`THANH TOAN HD T${invoice.month} ${invoice.contract?.room?.name || ""}`)}&accountName=CAMELSTAY`}
                  alt="VietQR"
                  className="w-32 h-auto"
                />
              </div>
              <div>
                <h3 className="font-black uppercase mb-1 text-indigo-900">
                  Thông tin chuyển khoản
                </h3>
                <div className="font-mono text-sm space-y-1">
                  <div className="flex gap-2">
                    <span className="font-bold text-gray-500 w-24">
                      Ngân hàng:
                    </span>
                    <span className="font-bold">TECHCOMBANK</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-gray-500 w-24">Số TK:</span>
                    <span className="font-black text-lg tracking-wider">
                      1998 1998 15
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-gray-500 w-24">
                      Chủ TK:
                    </span>
                    <span className="font-bold">CAMELSTAY OWNER</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-gray-500 w-24">
                      Nội dung:
                    </span>
                    <span className="italic text-indigo-700">
                      THANH TOAN HD T{invoice.month}{" "}
                      {invoice.contract?.room?.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TABLE */}
          <div className="mb-8">
            {isEditing ? (
              <Form
                form={form}
                layout="vertical"
                className="border-2 border-dashed border-black p-4 bg-gray-50"
              >
                <h3 className="font-bold uppercase mb-4">Chỉnh sửa hóa đơn</h3>

                {/* Extra Charges */}
                <Form.List name="extraCharges">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <div key={key} className="flex gap-2 items-start mb-2">
                          <Form.Item
                            {...restField}
                            name={[name, "name"]}
                            rules={[{ required: true, message: "Nhập tên" }]}
                            className="flex-1 mb-0"
                          >
                            <Input placeholder="Tên khoản phí" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, "amount"]}
                            rules={[
                              { required: true, message: "Nhập số tiền" },
                            ]}
                            className="w-32 mb-0"
                          >
                            <InputNumber
                              placeholder="Số tiền"
                              className="w-full"
                            />
                          </Form.Item>
                          <Button
                            onClick={() => remove(name)}
                            icon={<Trash2 size={16} />}
                            danger
                            className="border-black"
                          />
                        </div>
                      ))}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<Plus size={16} />}
                          className="border-black text-black"
                        >
                          Thêm khoản phát sinh
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item label="Giảm giá" name="discount">
                    <InputNumber
                      className="w-full"
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                    />
                  </Form.Item>
                  <Form.Item label="Ghi chú" name="note">
                    <Input />
                  </Form.Item>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button onClick={() => setIsEditing(false)}>Hủy</Button>
                  <Button
                    type="primary"
                    onClick={handleSaveDraft}
                    className="bg-black border-black"
                  >
                    Lưu thay đổi
                  </Button>
                </div>
              </Form>
            ) : (
              <Table
                dataSource={displayItems}
                columns={columns}
                pagination={false}
                rowKey={(record) => record.name + record.amount}
                className="neobrutalism-table border-2 border-black"
                summary={() => (
                  <Table.Summary.Row className="bg-gray-100 font-bold">
                    <Table.Summary.Cell
                      index={0}
                      colSpan={3}
                      className="text-right uppercase"
                    >
                      Tổng cộng
                    </Table.Summary.Cell>
                    <Table.Summary.Cell
                      index={1}
                      className="text-right text-lg"
                    >
                      {invoice.totalAmount.toLocaleString()}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex justify-between items-center border-t-2 border-black pt-6 print:hidden">
            <div className="flex gap-2">
              <Button
                icon={<Printer size={16} />}
                className="gumroad-btn-secondary"
                onClick={() => window.print()}
              >
                In hóa đơn
              </Button>

              {/* COPY LINK */}
              <Button
                icon={<Share2 size={16} />}
                className="gumroad-btn-secondary"
                onClick={() => {
                  if (!invoice.accessCode) {
                    message.error("Hóa đơn này chưa có mã truy cập (cũ).");
                    return;
                  }
                  const link = `${window.location.origin}/bill/${invoice.accessCode}`;
                  navigator.clipboard.writeText(link);
                  message.success("Đã copy link hóa đơn! 📋");
                }}
              >
                Copy Link
              </Button>

              {/* ZALO SHARE */}
              <Button
                icon={<Send size={16} />}
                className="bg-blue-500 text-white border-2 border-black font-bold hover:bg-blue-600 hover:text-white"
                onClick={() => {
                  if (!invoice.accessCode) {
                    message.error("Hóa đơn này chưa có mã truy cập (cũ).");
                    return;
                  }
                  const link = `${window.location.origin}/bill/${invoice.accessCode}`;
                  const zaloLink = `https://zalo.me/share?text=${encodeURIComponent(link)}`;
                  window.open(zaloLink, "_blank");
                }}
              >
                Gửi Zalo
              </Button>
            </div>

            <div className="flex gap-2">
              {isDraft ? (
                <>
                  {!isEditing && (
                    <Button
                      icon={<Edit size={16} />}
                      onClick={() => setIsEditing(true)}
                      className="gumroad-btn-secondary"
                      disabled={loading}
                    >
                      Sửa
                    </Button>
                  )}
                  <Popconfirm
                    title="Phát hành hóa đơn này?"
                    onConfirm={handlePublish}
                  >
                    <Button
                      icon={<Send size={16} />}
                      className="bg-[#00E054] text-white border-2 border-black font-bold shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase px-6 h-10"
                      loading={loading}
                    >
                      Phát hành
                    </Button>
                  </Popconfirm>
                </>
              ) : (
                <>
                  {invoice.status === InvoiceStatus.PUBLISHED && (
                    <Popconfirm
                      title="Hủy phát hành (về nháp)?"
                      onConfirm={handleUnpublish}
                    >
                      <Button
                        danger
                        className="border-2 border-red-500 font-bold"
                        loading={loading}
                      >
                        Hủy phát hành
                      </Button>
                    </Popconfirm>
                  )}

                  {invoice.debtAmount > 0 &&
                    invoice.status !== InvoiceStatus.CANCELLED && (
                      <Button
                        icon={<CheckCircle size={16} />}
                        onClick={() => setIsPaymentOpen(true)}
                        className="bg-[#00E054] text-white border-2 border-black font-bold shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase px-6 h-10"
                      >
                        Thanh toán
                      </Button>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        @media print {
          body > * {
            display: none !important;
          }
          .ant-modal-root,
          .ant-modal-root * {
            visibility: visible !important;
            display: block !important;
          }
          .ant-modal-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
          }
          .ant-modal-mask {
            display: none !important;
          }
          .ant-modal-wrap {
            position: static !important;
            width: 100%;
            height: 100%;
            overflow: visible !important;
          }
          .ant-modal {
            position: static !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .ant-modal-content {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
          .ant-modal-close {
            display: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <PaymentModal
        isOpen={isPaymentOpen}
        onCancel={() => setIsPaymentOpen(false)}
        onSuccess={() => {
          setIsPaymentOpen(false);
          onUpdate();
        }}
        invoice={invoice}
      />
    </>
  );
}
