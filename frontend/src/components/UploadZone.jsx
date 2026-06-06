import { useRef, useState } from "react";
import { Upload, Image as ImageIcon, Film } from "lucide-react";
import { toast } from "sonner";

const ACCEPT = "image/jpeg,image/png,image/webp,image/jpg,video/mp4,video/quicktime,video/webm";
const MAX_SIZE = 50 * 1024 * 1024;

export default function UploadZone({ onFileSelected }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const validate = (file) => {
    if (!file) return false;
    if (file.size > MAX_SIZE) {
      toast.error("File is too large (max 50MB).");
      return false;
    }
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Only images and videos are supported.");
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (validate(f)) onFileSelected(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (validate(f)) onFileSelected(f);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      data-testid="upload-zone"
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed border-black p-10 sm:p-14 text-center transition-all focus:outline-none focus:ring-4 focus:ring-black shadow-brutal ${
        isDragging ? "bg-[#D1F2E3] scale-[1.01]" : "bg-white hover:bg-[#FEF0A5]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleChange}
        data-testid="upload-file-input"
      />
      <div className="flex items-center justify-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full border-2 border-black bg-[#E6D8F8] flex items-center justify-center shadow-brutal-sm">
          <ImageIcon className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <div className="w-14 h-14 rounded-full border-2 border-black bg-black text-white flex items-center justify-center shadow-brutal">
          <Upload className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div className="w-12 h-12 rounded-full border-2 border-black bg-[#FFDCC2] flex items-center justify-center shadow-brutal-sm">
          <Film className="w-5 h-5" strokeWidth={2.5} />
        </div>
      </div>
      <div className="font-heading text-2xl sm:text-3xl font-black tracking-tight">
        Drop your moment here
      </div>
      <div className="mt-2 text-sm text-[#4A4A4A]">
        or <span className="underline font-bold">click to browse</span> — JPG · PNG · WEBP · MP4 · MOV (max 50MB)
      </div>
    </div>
  );
}
