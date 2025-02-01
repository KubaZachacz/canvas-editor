import React, { useRef } from "react";
import { ActionButton } from "@/components/ui";
import { ActionButtonProps } from "./ui/ActionButton";

type ImgLoadButtonProps = Omit<ActionButtonProps, "onClick"> & {
  onLoaded: (base64: string) => void;
};

const ImgLoadButton = ({
  onLoaded,
  children,
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
        {children}
      </ActionButton>
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
