"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import axios from "@/lib/axios-client";
import { message } from "antd";

export const UploadCCCD = ({
  side,
  onUpload,
  defaultValue,
}: {
  side: "front" | "back";
  onUpload: (url: string) => void;
  defaultValue?: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(defaultValue || null);

  useEffect(() => {
    if (defaultValue) setImageUrl(defaultValue);
  }, [defaultValue]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/upload/image/tenants", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.data.url;
      setImageUrl(url);
      onUpload(url);
      message.success("Upload ảnh thành công!");
    } catch (error) {
      console.error(error);
      message.error("Lỗi upload ảnh");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 hover:border-[#D97757] transition-all relative h-32 flex items-center justify-center group bg-white">
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
      />
      {loading ? (
        <Loader2 className="animate-spin text-[#D97757]" />
      ) : imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt="CCCD"
          className="h-full object-contain rounded-md"
        />
      ) : (
        <div className="text-gray-400 group-hover:text-[#D97757] transition-colors">
          <Plus className="mx-auto mb-1" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            {side === "front" ? "Mặt trước" : "Mặt sau"}
          </span>
        </div>
      )}
    </div>
  );
};

export default UploadCCCD;
