export type ToastProps = {
  title?: string; description?: string;
  action?: React.ReactNode; onOpenChange?: (open: boolean) => void; open?: boolean;
};
export const Toast = (_props: ToastProps) => null;
export const toast = (o: { title?: string; description?: string }) => {
  if (typeof window !== "undefined") {
    console.log("[toast]", o?.title ?? "", o?.description ?? "");
  }
};
