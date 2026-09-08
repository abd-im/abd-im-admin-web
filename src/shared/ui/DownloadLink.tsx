export function DownloadLink({ url }: { url: string }) {
  let href: string | undefined;
  try {
    const parsed = new URL(url);
    if (["https:", "http:"].includes(parsed.protocol)) href = parsed.href;
  } catch {
    /* An absent or invalid URL has no download action. */
  }
  return href ? (
    <a className="text-link truncate" href={href} title={url} target="_blank" rel="noreferrer">
      {url}
    </a>
  ) : (
    <span>-</span>
  );
}
