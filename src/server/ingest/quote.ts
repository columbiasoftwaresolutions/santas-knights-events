// Evidence is only evidence if the quote is really on the page. Compare after
// normalizing the things that differ between HTML and what a person copies:
// whitespace, non-breaking spaces and curly quotes.

export function normalizeText(text: string): string {
  return text
    .replace(/[   ]/g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function containsQuote(pageText: string, quote: string): boolean {
  const q = normalizeText(quote);
  return q.length > 0 && normalizeText(pageText).includes(q);
}

// Visible text of an HTML page, good enough for a substring check. Scripts and
// styles are dropped, tags become spaces, common entities are decoded.
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
}
