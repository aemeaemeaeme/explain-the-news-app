import * as React from "react";
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className="", ...rest }, ref) => (
    <textarea ref={ref} className={`w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 ${className}`} {...rest} />
  )
);
Textarea.displayName = "Textarea";
export default Textarea;
