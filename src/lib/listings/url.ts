import { Schema } from "effect";

// Source links come from scraped pages and feeds, so they are untrusted. Only
// plain http(s) URLs without embedded credentials are ever stored or rendered.

export function parseHttpUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username !== "" || url.password !== "") return null;
  return url;
}

// Hosts known to serve https. Feeds still publish http:// links for them.
const HTTPS_HOSTS = new Set(["nycgovparks.org", "www.nycgovparks.org"]);

// Returns a safe, normalized URL string, or null when the input is not usable.
export function normalizeSourceUrl(input: string): string | null {
  const url = parseHttpUrl(input.trim());
  if (!url) return null;
  if (url.protocol === "http:" && HTTPS_HOSTS.has(url.hostname)) url.protocol = "https:";
  return url.toString();
}

export const HttpUrl = Schema.String.check(
  Schema.makeFilter(
    (s: string) => parseHttpUrl(s) !== null || "Expected an http(s) URL without credentials",
  ),
);
