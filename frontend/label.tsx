export function Label({ className="", children, htmlFor }: { className?: string; children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className={`text-sm font-medium text-gray-700 ${className}`}>{children}</label>;
}
