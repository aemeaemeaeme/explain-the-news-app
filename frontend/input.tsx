import * as React from "react";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className="", ...rest }, ref) => (
    <input ref={ref} className={`w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 ${className}`} {...rest} />
  )
);
Input.displayName = "Input";
export default Input;
