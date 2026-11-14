// Minimal Harvard-style reference formatter. Not exhaustive — covers
// journal articles, books, and web pages with the fields commonly returned
// by CrossRef and Open Graph.

export type RefMetadata = {
  type?: "journal-article" | "book" | "book-chapter" | "report" | "webpage" | "thesis";
  title?: string;
  authors?: { family?: string; given?: string }[];
  year?: number | string;
  containerTitle?: string; // journal / book title
  volume?: string | number;
  issue?: string | number;
  pages?: string;
  publisher?: string;
  publisherPlace?: string;
  doi?: string;
  url?: string;
  accessed?: string; // ISO date
  edition?: string;
};

function formatAuthors(authors?: RefMetadata["authors"]): string {
  if (!authors || authors.length === 0) return "Anon.";
  const parts = authors.map((a) => {
    const family = (a.family ?? "").trim();
    const given = (a.given ?? "")
      .trim()
      .split(/\s+/)
      .map((g) => (g[0] ? `${g[0]}.` : ""))
      .join(" ");
    return family ? `${family}, ${given}`.trim() : given;
  });
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function formatHarvard(meta: RefMetadata): string {
  const authors = formatAuthors(meta.authors);
  const year = meta.year ? `(${meta.year})` : "(n.d.)";
  const title = meta.title ?? "Untitled";
  const accessed =
    meta.accessed ?? new Date().toISOString().slice(0, 10);
  const accessedHuman = new Date(accessed).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  switch (meta.type) {
    case "journal-article": {
      const journal = meta.containerTitle ?? "";
      const vol = meta.volume ? `${meta.volume}` : "";
      const iss = meta.issue ? `(${meta.issue})` : "";
      const pages = meta.pages ? `: ${meta.pages}` : "";
      const ref = `${authors} ${year} ${title}. ${journal ? italicize(journal) + ", " : ""}${vol}${iss}${pages}.`;
      return meta.doi ? `${ref} doi:${meta.doi}` : ref;
    }
    case "book": {
      const place = meta.publisherPlace ? `${meta.publisherPlace}: ` : "";
      const pub = meta.publisher ?? "";
      const ed = meta.edition ? ` ${meta.edition} ed.` : "";
      return `${authors} ${year} ${italicize(title)}.${ed} ${place}${pub}.`.replace(/\s+/g, " ").trim();
    }
    case "webpage":
    default: {
      const url = meta.url ?? "";
      const site = meta.containerTitle ? `${meta.containerTitle}. ` : "";
      return `${authors} ${year} ${title}. ${site}Available from: ${url} [Accessed ${accessedHuman}].`;
    }
  }
}

function italicize(s: string): string {
  // Markdown-style italics; the UI can render or strip these as needed.
  return `*${s}*`;
}

export async function lookupDoi(doi: string): Promise<RefMetadata> {
  const cleaned = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();
  const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleaned)}`);
  if (!res.ok) throw new Error(`CrossRef ${res.status}`);
  const json = (await res.json()) as { message: Record<string, unknown> };
  const m = json.message;
  const issued = (m["issued"] as { "date-parts"?: number[][] } | undefined)?.["date-parts"]?.[0]?.[0];
  const authors = ((m["author"] as { family?: string; given?: string }[]) ?? []).map((a) => ({
    family: a.family,
    given: a.given,
  }));
  const containerTitle = ((m["container-title"] as string[]) ?? [])[0];
  const titleStr = ((m["title"] as string[]) ?? [])[0];
  const typeMap: Record<string, RefMetadata["type"]> = {
    "journal-article": "journal-article",
    "book": "book",
    "book-chapter": "book-chapter",
    "report": "report",
    "monograph": "book",
  };
  return {
    type: typeMap[m["type"] as string] ?? "journal-article",
    title: titleStr,
    authors,
    year: issued,
    containerTitle,
    volume: m["volume"] as string | undefined,
    issue: m["issue"] as string | undefined,
    pages: m["page"] as string | undefined,
    publisher: m["publisher"] as string | undefined,
    doi: m["DOI"] as string | undefined,
    url: m["URL"] as string | undefined,
  };
}

export async function lookupUrl(url: string): Promise<RefMetadata> {
  // Best-effort via Open Graph parsed from the page. Many sites block CORS,
  // so this often fails — the user can fall back to manual entry.
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const get = (re: RegExp) => html.match(re)?.[1]?.trim();
    const title = get(/<meta property="og:title" content="([^"]+)"/i) ?? get(/<title[^>]*>([^<]+)<\/title>/i);
    const site = get(/<meta property="og:site_name" content="([^"]+)"/i);
    const author = get(/<meta name="author" content="([^"]+)"/i);
    const date = get(/<meta property="article:published_time" content="([^"]+)"/i);
    return {
      type: "webpage",
      title,
      containerTitle: site,
      authors: author ? [{ family: author }] : undefined,
      year: date ? new Date(date).getFullYear() : undefined,
      url,
    };
  } catch {
    return { type: "webpage", title: url, url };
  }
}
