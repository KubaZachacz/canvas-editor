import React, { useRef } from "react";
import { ActionButton } from "@/components/ui";
import { ActionButtonProps } from "./ui/ActionButton";

type ImgLoadButtonProps = Omit<ActionButtonProps, "onClick" | "children"> & {
  onLoaded: (base64: string) => void;
  label: string;
};

const ImgLoadButton = ({
  onLoaded,
  label,
  className,
  icon,
}: ImgLoadButtonProps) => {
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
          onLoaded(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <ActionButton
        icon={icon}
        onClick={handleClick}
        className={className}
        type="button"
      >
        {label}
      </ActionButton>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        data-testid={`file-input-for-${label}`}
      />
    </>
  );
};

export default ImgLoadButton;
