import { api } from "encore.dev/api";

// Simple test endpoint that should always work
export const test = api(
  { expose: true, method: "GET", path: "/test" },
  async () => {
    return {
      message: "Backend is working!",
      timestamp: new Date().toISOString(),
      status: "ok"
    };
  }
);
