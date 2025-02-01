import React, { useRef } from "react";

interface ImgLoadButtonProps {
  onLoad: (base64: string) => void;
  children: React.ReactNode;
  className?: string;
}

const ImgLoadButton: React.FC<ImgLoadButtonProps> = ({
  onLoad,
  children,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && typeof reader.result === "string") {
          onLoad(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <button onClick={handleClick} className={className} type="button">
        {children}
      </button>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
};

export default ImgLoadButton;
