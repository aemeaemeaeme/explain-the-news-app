export function Card({ className="", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-xl border border-gray-200 p-4 bg-white shadow-sm ${className}`}>{children}</div>;
}
export function CardHeader({ children }: { children: React.ReactNode }) { return <div className="mb-2">{children}</div>; }
export function CardContent({ children }: { children: React.ReactNode }) { return <div>{children}</div>; }
export function CardTitle({ children }: { children: React.ReactNode }) { return <h3 className="text-lg font-semibold">{children}</h3>; }
