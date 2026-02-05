"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { message, Upload, Button, Input, Spin, Checkbox } from "antd";
import { readingsApi } from "@/lib/api/readings";
import axiosClient from "@/lib/axios-client";
import dayjs from "dayjs";
import TenantEmptyState from "@/components/tenant/TenantEmptyState";

// Types
interface ReadingServiceState {
  serviceId: number;
  serviceName: string;
  serviceUnit: string;
  servicePrice: number;
  oldIndex: number;
  newIndex?: number;
  isMeterReset?: boolean;
  imageUrls: string[];
  isSubmitting: boolean;
  isCompleted: boolean; // True if submitted
  existingReading?: {
    id: number;
    newIndex: number;
    usage: number;
    totalCost: number;
    imageUrls?: string[];
  };
}

interface PrepareResponse {
  contractId: number;
  serviceId: number;
  serviceName: string;
  serviceUnit: string;
  servicePrice: number;
  month: string;
  oldIndex: number;
  isFirstReading: boolean;
  existingReading?: {
    id: number;
    newIndex: number;
    usage: number;
    totalCost: number;
    imageUrls?: string[];
  };
}

export default function TenantReadingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<any>(null);
  const [services, setServices] = useState<ReadingServiceState[]>([]);
  const [currentMonth] = useState(dayjs().format("MM-YYYY"));

  // Fetch Tenant & Contract Info
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Get User Profile to find Tenant & Contract
      // Assuming a simplified flow: Get current user -> Get Tenant Profile -> Get Active Contract
      // For now, let's assume we have an endpoint or we parse local storage user
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        router.push("/login");
        return;
      }
      // const user = JSON.parse(userStr); // This line is not used in the new snippet

      // We need tenantId. If not in user, fetch profile
      // Quick fix: Fetch /auth/profile
      const profile = await axiosClient.get("/auth/profile");
      const tenant = profile.data.tenant;

      if (!tenant) {
        message.error(
          `Tài khoản ${profile.data.email} không phải là Khách thuê!`,
        );
        setLoading(false);
        return;
      }

      // Find active contract
      const activeContract = tenant.contracts?.find((c: any) => c.isActive);
      if (!activeContract) {
        // Just return, handled in render
        setLoading(false);
        return;
      }

      setContract(activeContract);

      // 2. Fetch Prepare Data for Electricity (ServiceId usually known or fetch list)
      // Ideally we fetch a list of INDEX services for this contract.
      // For MVP, we assume Service IDs: Electricity (index) and Water (index).
      // BUT better: Get all services of specific type 'INDEX' that are in the contract.
      // Since contract usually links to Room which has services... or services are global.
      // Let's hardcode fetching specific common services or use a 'getServices' API if available.
      // Or simply: Call prepare for expected services.
      // A robust way: backend should have 'get-my-index-services'.
      // Current approach: Let's assume ID 1=Dien, 2=Nuoc temporarily or fetch from 'services' API.

      // Let's try to fetch all services first -> Filter by type INDEX
      const allServices = await axiosClient.get("/services"); // Need to check if this exists
      const indexServices = allServices.data.filter(
        (s: any) => s.type === "INDEX" && s.isActive,
      );

      const preparedData = await Promise.all(
        indexServices.map(async (s: any) => {
          try {
            // Call Prepare API
            const prep = (await readingsApi.prepare(
              activeContract.id,
              s.id,
              currentMonth,
            )) as unknown as PrepareResponse;
            return {
              serviceId: s.id,
              serviceName: s.name,
              serviceUnit: s.unit,
              servicePrice: s.price,
              oldIndex: prep.oldIndex,
              newIndex: prep.existingReading?.newIndex, // Pre-fill if exists
              isMeterReset: false,
              imageUrls: prep.existingReading?.imageUrls || [],
              isSubmitting: false,
              isCompleted: !!prep.existingReading,
              existingReading: prep.existingReading,
            };
          } catch (e) {
            console.error(e);
            return null;
          }
        }),
      );

      setServices(
        preparedData.filter((s): s is ReadingServiceState => s !== null),
      );
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [currentMonth, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpload = async (file: File, index: number) => {
    // Custom upload to Cloudinary via our backend
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axiosClient.post("/upload/image/readings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.data.url;

      // Update state
      const newServices = [...services];
      newServices[index].imageUrls.push(url);
      setServices(newServices);
      message.success("Upload ảnh thành công!");
    } catch (e) {
      message.error("Upload ảnh thất bại!");
    }
  };

  const handleSubmit = async (index: number) => {
    const s = services[index];
    if (s.newIndex === undefined || s.newIndex === null) {
      message.error("Vui lòng nhập chỉ số mới");
      return;
    }
    if (!s.isMeterReset && s.newIndex < s.oldIndex) {
      message.error("Chỉ số mới không được nhỏ hơn chỉ số cũ");
      return;
    }
    if (s.imageUrls.length === 0) {
      message.warning("Vui lòng chụp ảnh đồng hồ để đối chiếu");
      // Allow submitting without image? User requested "w/ image", enforce it?
      // Let's enforce 1 image at least.
      return;
    }

    try {
      const newServices = [...services];
      newServices[index].isSubmitting = true;
      setServices(newServices);

      await readingsApi.create({
        contractId: contract.id,
        serviceId: s.serviceId,
        month: currentMonth,
        oldIndex: s.oldIndex,
        newIndex: s.newIndex,
        imageUrls: s.imageUrls,
        isConfirmed: false, // TENANT submission
        isMeterReset: s.isMeterReset,
      });

      message.success("Gửi chốt số thành công! Chờ Admin duyệt.");

      // Refresh data
      fetchData();
    } catch (e) {
      message.error("Lỗi khi gửi chốt số.");
      const newServices = [...services];
      newServices[index].isSubmitting = false;
      setServices(newServices);
    }
  };

  // Helper to calculate usage
  const calculateUsage = (s: ReadingServiceState) => {
    if (s.newIndex === undefined) return 0;
    if (s.isMeterReset) return s.newIndex;
    if (s.newIndex < s.oldIndex) return 0;
    return s.newIndex - s.oldIndex;
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );

  // Check specifically for no contract state to render empty state
  if (!loading && !contract) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] pb-24 font-sans text-slate-900">
        <div className="bg-white/80 backdrop-blur-md p-4 border-b border-slate-100 sticky top-0 z-20 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Chốt Điện Nước
          </h1>
        </div>
        <TenantEmptyState
          icon={UploadCloud}
          title="Chưa có dịch vụ"
          description="Chức năng chốt điện nước chỉ dành cho khách đang có hợp đồng thuê phòng."
          actionLabel="Quay lại Trang chủ"
          actionLink="/tenant"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7] pb-24 font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-4 border-b border-slate-100 sticky top-0 z-20 flex items-center justify-between shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Chốt Điện Nước
          </h1>
        </div>
        <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          T{dayjs().format("MM/YYYY")}
        </span>
      </div>

      <div className="p-4 space-y-6">
        {(!services || services.length === 0) && (
          <div className="text-center text-slate-500 mt-20 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <UploadCloud size={28} />
            </div>
            Không tìm thấy dịch vụ nào cần chốt.
          </div>
        )}

        {services.map((s, idx) => (
          <div
            key={s.serviceId}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-lg hover:border-indigo-100 group"
          >
            {/* Service Header */}
            <div
              className={`p-5 border-b border-slate-100 flex justify-between items-center transition-colors ${s.isCompleted ? "bg-emerald-50/50" : "bg-white"}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${s.serviceName.includes("Điện") ? "bg-amber-100 text-amber-600" : "bg-cyan-100 text-cyan-600"}`}
                >
                  {s.serviceName.includes("Điện") ? (
                    <UploadCloud size={24} />
                  ) : (
                    <UploadCloud size={24} />
                  )}
                  {/* Icon logic can be better */}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">
                    {s.serviceName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Đơn giá:{" "}
                    <span className="text-slate-700 font-bold">
                      {s.servicePrice.toLocaleString()} đ
                    </span>
                    /{s.serviceUnit}
                  </p>
                </div>
              </div>
              {s.isCompleted && (
                <span className="text-emerald-700 font-bold text-[10px] bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={12} strokeWidth={2.5} /> ĐÃ CHỐT
                </span>
              )}
            </div>

            {/* Form Body */}
            <div className="p-5 space-y-6">
              {/* Stats */}
              <div className="flex gap-4">
                <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Số cũ
                  </p>
                  <p className="font-bold text-xl text-slate-700 font-mono">
                    {s.oldIndex}
                  </p>
                </div>
                <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                  <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-1">
                    Số mới
                  </p>
                  {s.isCompleted ? (
                    <p className="font-bold text-xl text-slate-900 font-mono">
                      {s.existingReading?.newIndex}
                    </p>
                  ) : (
                    <>
                      <Input
                        type="number"
                        status={
                          !s.isMeterReset &&
                          s.newIndex !== undefined &&
                          s.newIndex < s.oldIndex
                            ? "error"
                            : ""
                        }
                        className="font-bold text-xl text-slate-900 bg-transparent border-none p-0 h-auto focus:shadow-none placeholder:text-slate-300 font-mono"
                        placeholder="0"
                        value={s.newIndex}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const newServices = [...services];
                          newServices[idx].newIndex = isNaN(val)
                            ? undefined
                            : val;
                          setServices(newServices);
                        }}
                      />
                      {!s.isMeterReset &&
                        s.newIndex !== undefined &&
                        s.newIndex < s.oldIndex && (
                          <p className="text-red-500 text-[10px] mt-1 font-bold flex items-center gap-1">
                            <AlertCircle size={10} />
                            Thấp hơn số cũ ({s.oldIndex})
                          </p>
                        )}
                    </>
                  )}
                </div>
              </div>

              {/* Meter Reset Checkbox */}
              {!s.isCompleted && (
                <div className="flex items-center gap-2 px-1">
                  <Checkbox
                    checked={s.isMeterReset}
                    onChange={(e) => {
                      const newServices = [...services];
                      newServices[idx].isMeterReset = e.target.checked;
                      setServices(newServices);
                    }}
                  >
                    <span className="text-sm font-medium text-slate-600">
                      Đồng hồ đã được thay thế / quay vòng
                    </span>
                  </Checkbox>
                </div>
              )}

              {/* Usage */}
              <div className="flex justify-between items-center text-sm font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500">Tiêu thụ ước tính:</span>
                <span className="font-bold text-indigo-600 text-lg">
                  {calculateUsage(s)}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    {s.serviceUnit}
                  </span>
                </span>
              </div>

              {/* Image Upload */}
              <div>
                <p className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide">
                  Hình ảnh minh chứng
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {s.imageUrls.map((url, i) => (
                    <div
                      key={i}
                      className="w-24 h-24 rounded-xl border border-slate-200 bg-slate-50 flex-shrink-0 relative overflow-hidden shadow-sm"
                    >
                      <img
                        src={url}
                        alt="Reading"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}

                  {!s.isCompleted && (
                    <Upload
                      showUploadList={false}
                      beforeUpload={(file) => {
                        handleUpload(file, idx);
                        return false;
                      }}
                    >
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white hover:border-indigo-400 transition-all group/upload">
                        <Camera
                          size={24}
                          className="text-slate-400 group-hover/upload:text-indigo-500 transition-colors"
                        />
                        <span className="text-[10px] text-slate-400 font-bold group-hover/upload:text-indigo-500 transition-colors">
                          THÊM ẢNH
                        </span>
                      </div>
                    </Upload>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {!s.isCompleted && (
                <div className="pt-2">
                  <Button
                    loading={s.isSubmitting}
                    onClick={() => handleSubmit(idx)}
                    className="w-full h-12 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-600 hover:shadow-indigo-500/20 border-none transition-all active:scale-[0.98] text-sm tracking-wide"
                  >
                    Gửi Chốt Số
                  </Button>
                </div>
              )}

              {s.isCompleted && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex gap-3 items-start">
                  <CheckCircle2
                    size={20}
                    className="text-emerald-600 mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-bold text-emerald-800 mb-0.5">
                      Đã gửi thành công
                    </p>
                    <p className="text-xs text-emerald-600 leading-relaxed">
                      Số liệu đã được ghi nhận. Vui lòng chờ quản lý xác nhận
                      trước khi có hóa đơn chính thức.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
