import { cn } from "@/utils/cn";
import React from "react";

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const ActionButton = ({
  className,
  icon: Icon,
  children,
  ...rest
}: ActionButtonProps) => {
  return (
    <button
      {...rest}
      className={cn(
        "bg-white-97 rounded-large transition-colors font-bold px-4 py-6 flex items-center flex-col gap-6 cursor-pointer focus:outline-2 outline-primary-50 hover:bg-black-25 disabled:opacity-75 disabled:cursor-auto",
        className
      )}
    >
      <Icon className="text-black-75 text-9xl" />
      <span className="font-medium">{children}</span>
    </button>
  );
};

export default ActionButton;
