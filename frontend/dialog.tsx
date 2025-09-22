import * as React from "react";

export function Dialog(props: { open: boolean; onOpenChange: (o: boolean)=>void; children: React.ReactNode }) {
  if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog" onClick={()=>props.onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10" onClick={(e)=>e.stopPropagation()}>{props.children}</div>
    </div>
  );
}

export function DialogContent({ className="", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 ${className}`}>{children}</div>;
}
export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}
export function DialogTitle({ className="", children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>;
}
