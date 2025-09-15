// src/lib/post_to_clay.ts
export type ClayPostResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; status?: number; error: string; body?: unknown };

export interface PostToClayOpts {
  url?: string;               // defaults to process.env.CLAY_WEBHOOK_URL
  payload: unknown;
  timeoutMs?: number;         // per attempt
  retries?: number;           // retry on 5xx/network
  retryDelayMs?: number;      // ms; simple linear backoff
}

export async function postToClay({
  url = process.env.CLAY_WEBHOOK_URL,
  payload,
  timeoutMs = 1500,
  retries = 1,
  retryDelayMs = 300,
}: PostToClayOpts): Promise<ClayPostResult> {
  if (!url) return { ok: false, error: "No CLAY_WEBHOOK_URL configured" };

  let attempt = 0;
  // simple linear backoff
  while (true) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "tally-enricher/preview",
        },
        body: JSON.stringify(payload),
        signal: ac.signal,
      });

      const text = await res.text();
      let body: unknown = text;
      try { body = text ? JSON.parse(text) : null; } catch { /* leave text */ }

      if (res.ok) return { ok: true, status: res.status, body };

      if (res.status >= 400 && res.status < 500) {
        return { ok: false, status: res.status, error: `Clay 4xx`, body };
      }

      if (attempt < retries) {
        attempt++;
        await new Promise(r => setTimeout(r, retryDelayMs * attempt));
        continue;
      }
      return { ok: false, status: res.status, error: `Clay 5xx`, body };
    } catch (e) {
      if (attempt < retries) {
        attempt++;
        await new Promise(r => setTimeout(r, retryDelayMs * attempt));
        continue;
      }
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    } finally {
      clearTimeout(timer);
    }
  }
}
