// Honest, identifiable fetching. Sources that block this are skipped, never worked around.

export const USER_AGENT =
  "santas-knights-directory/0.1 (nonprofit directory of free classes; contact via santasknights.org)";

export type FetchImpl = typeof fetch;

const RETRYABLE = new Set([502, 503, 504]);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries only a server that says it is busy (502/503/504) or a dropped connection,
// twice, with a pause. Any other status (403, 404, 429) is final: we do not push.
export async function fetchText(
  url: string,
  options: {
    fetchImpl?: FetchImpl;
    timeoutMs?: number;
    accept?: string;
    retryDelayMs?: number;
  } = {},
): Promise<string> {
  const { fetchImpl = fetch, timeoutMs = 20_000, accept = "*/*", retryDelayMs = 2_000 } = options;
  let lastError: Error = new Error(`Could not fetch ${url}`);
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      // oxlint-disable-next-line no-await-in-loop -- attempts are sequential by design
      await sleep(retryDelayMs * attempt);
    }
    let response: Response;
    try {
      // oxlint-disable-next-line no-await-in-loop -- attempts are sequential by design
      response = await fetchImpl(url, {
        headers: { "user-agent": USER_AGENT, accept },
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "follow",
      });
    } catch (error) {
      // A dropped connection or timeout: try again.
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
    if (response.ok) return response.text();
    lastError = new Error(`HTTP ${response.status} for ${url}`);
    if (!RETRYABLE.has(response.status)) throw lastError;
  }
  throw lastError;
}
