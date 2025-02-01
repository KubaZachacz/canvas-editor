import { cn } from "@/utils/cn";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = ({ className, ...rest }: ButtonProps) => {
  return (
    <button
      {...rest}
      className={cn(
        "rounded-medium cursor-pointer bg-primary-100 hover:bg-primary-150 text-[#fff] font-semibold text-button min-h-10 flex items-center justify-center px-8 focus:outline-2 transition-colors outline-primary-50 disabled:bg-black-25 disabled:cursor-auto",
        className
      )}
    />
  );
};

export default Button;
