import { api } from "encore.dev/api";

interface HealthResponse {
  ok: boolean;
  ts: number;
}

export const health = api<{}, HealthResponse>(
  { expose: true, method: "GET", path: "/health" },
  async () => {
    return { ok: true, ts: Date.now() };
  }
);