/** Browser address bar and ordinary hyperlink drag payloads. */
export interface DroppedBrowserLink {
  url: string;
  title: string;
  hasPageTitle: boolean;
}

function cleanText(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (match, code: string) => {
    const named: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
    if (!code.startsWith("#")) return named[code.toLowerCase()] ?? match;
    const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
  }).replace(/\s+/g, " ").trim().slice(0, 300);
}

function httpUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch { return null; }
}

function isTitle(value: string, url: URL): boolean {
  const normalized = value.trim().toLowerCase().replace(/^www\./, "").replace(/\/$/, "");
  return !!normalized && normalized !== url.href.toLowerCase().replace(/\/$/, "")
    && normalized !== url.hostname.toLowerCase().replace(/^www\./, "")
    && !/^https?:\/\//i.test(value);
}

export function parseDroppedBrowserLink(data: Pick<DataTransfer, "getData">): DroppedBrowserLink | null {
  const uri = data.getData("text/uri-list").split(/\r?\n/).find(line => line.trim() && !line.startsWith("#"))?.trim() ?? "";
  const moz = data.getData("text/x-moz-url").split(/\r?\n/);
  const plain = data.getData("text/plain").trim();
  const html = data.getData("text/html");
  // Chrome may transfer a named HTML link even when text/plain is just the URL.
  const anchor = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a\s*>/i.exec(html);
  const anchorUrl = cleanText(anchor?.[1] ?? anchor?.[2] ?? anchor?.[3] ?? "");
  const anchorTitle = cleanText(anchor?.[4] ?? "");
  const plainLines = plain.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const download = /^([^:]+):(.+):(https?:\/\/\S+)$/i.exec(data.getData("DownloadURL"));
  const url = [uri, moz[0], anchorUrl, ...plainLines, download?.[3] ?? ""].map(httpUrl).find(Boolean);
  if (!url) return null;

  const titleCandidates = [
    moz[1] || "",
    httpUrl(anchorUrl)?.href === url.href ? anchorTitle : "",
    plainLines.find(line => !httpUrl(line)) || "",
    download?.[2]?.replace(/\.url$/i, "") || "",
  ];
  const meaningful = titleCandidates.map(cleanText).find(title => isTitle(title, url));
  return { url: url.href, title: meaningful || url.hostname, hasPageTitle: Boolean(meaningful) };
}
