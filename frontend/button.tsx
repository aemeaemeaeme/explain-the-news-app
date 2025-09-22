import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline";
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ className = "", variant = "default", ...rest }, ref) => {
    const base = "inline-flex items-center justify-center rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variants: Record<string,string> = {
      default: "bg-[#A3B18A] text-white hover:bg-[#8fa573] focus:ring-[#A3B18A]",
      ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300",
      outline: "border border-gray-300 text-gray-800 hover:bg-gray-50 focus:ring-gray-300",
    };
    return <button ref={ref} className={`${base} ${variants[variant] || variants.default} ${className}`} {...rest} />;
  }
);
Button.displayName = "Button";
export default Button;
