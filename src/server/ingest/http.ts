// Honest, identifiable fetching. Sources that block this are skipped, never worked around.

export const USER_AGENT =
  "santas-knights-directory/0.1 (nonprofit directory of free classes; contact via santasknights.org)";

export type FetchImpl = typeof fetch;

export async function fetchText(
  url: string,
  options: { fetchImpl?: FetchImpl; timeoutMs?: number; accept?: string } = {},
): Promise<string> {
  const { fetchImpl = fetch, timeoutMs = 20_000, accept = "*/*" } = options;
  const response = await fetchImpl(url, {
    headers: { "user-agent": USER_AGENT, accept },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}
