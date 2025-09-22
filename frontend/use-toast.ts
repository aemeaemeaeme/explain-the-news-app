export function useToast() {
  return {
    toast: (o: { title?: string; description?: string }) => {
      if (typeof window !== "undefined") {
        console.log("[toast]", o?.title ?? "", o?.description ?? "");
      }
    },
  };
}
