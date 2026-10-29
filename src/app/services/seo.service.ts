import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { SITE_CONFIG } from '../site-config';

export interface PageSeoConfig {
  /** Page title (without site suffix unless rawTitle is true). */
  title?: string;
  /** If true, uses `title` verbatim without appending ` — Εργασιακός Οδηγός Βάσης`. */
  rawTitle?: boolean;
  /** Meta & OpenGraph description. */
  description?: string;
  /** Route path starting with `/` (e.g. `/tools`, `/wiki/adeies/adia-gamos.md`). */
  path?: string;
  /** OpenGraph type (`website` or `article`). */
  type?: 'website' | 'article';
  /** Absolute URL to social preview image. */
  image?: string;
  /** Set true on 404 / error states to prevent search engine indexing. */
  noIndex?: boolean;
  /** Optional JSON-LD structured data object(s) to inject for this page. */
  jsonLd?: Record<string, unknown> | ReadonlyArray<Record<string, unknown>>;
}

export interface ParsedMarkdownSeo {
  title: string;
  category: string;
  description: string;
  bodyWithoutFrontmatter: string;
}

const DEFAULT_JSONLD_ID = 'seo-jsonld';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  /**
   * Updates `<title>`, `<meta name="description">`, Open Graph, Twitter Card,
   * `<link rel="canonical">`, robots directives, and optional JSON-LD schema.
   */
  updatePageSeo(config: PageSeoConfig): void {
    const fullTitle = this.formatTitle(config.title, config.rawTitle);
    const description = (config.description || SITE_CONFIG.defaultDescription).trim();
    const canonicalUrl = this.buildCanonicalUrl(config.path);
    const ogType = config.type ?? 'website';
    const imageUrl = config.image || SITE_CONFIG.defaultOgImage;

    this.titleService.setTitle(fullTitle);

    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:type', content: ogType });
    this.metaService.updateTag({ property: 'og:site_name', content: SITE_CONFIG.name });
    this.metaService.updateTag({ property: 'og:locale', content: 'el_GR' });
    this.metaService.updateTag({ property: 'og:title', content: fullTitle });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:url', content: canonicalUrl });
    this.metaService.updateTag({ property: 'og:image', content: imageUrl });

    this.metaService.updateTag({ name: 'twitter:card', content: 'summary' });
    this.metaService.updateTag({ name: 'twitter:title', content: fullTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: imageUrl });

    if (config.noIndex) {
      this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.metaService.removeTag("name='robots'");
    }

    this.setCanonicalLink(canonicalUrl);

    if (config.jsonLd) {
      this.setJsonLd(DEFAULT_JSONLD_ID, config.jsonLd);
    } else {
      this.removeJsonLd(DEFAULT_JSONLD_ID);
    }
  }

  /** Injects or replaces a `<script type="application/ld+json">` tag in `<head>`. */
  setJsonLd(
    id: string,
    schema: Record<string, unknown> | ReadonlyArray<Record<string, unknown>>,
  ): void {
    this.removeJsonLd(id);
    if (!this.doc?.head) return;

    const payload = Array.isArray(schema)
      ? { '@context': 'https://schema.org', '@graph': schema }
      : schema;

    const script = this.doc.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(payload);
    this.doc.head.appendChild(script);
  }

  /** Removes a previously injected JSON-LD `<script>` tag by ID. */
  removeJsonLd(id = DEFAULT_JSONLD_ID): void {
    const existing = this.doc?.getElementById(id);
    if (existing) {
      existing.remove();
    }
  }

  /**
   * Parses YAML frontmatter (`title`, `category`, `description`) and extracts a clean
   * ~155-character plain-text summary from the markdown body for SEO meta descriptions.
   */
  parseMarkdownSeo(rawMarkdown: string, maxDescriptionLength = 155): ParsedMarkdownSeo {
    const fm: Record<string, string> = {};
    let bodyWithoutFrontmatter = rawMarkdown || '';

    const fmMatch = bodyWithoutFrontmatter.match(/^---\r?\n([\s\S]*?)\r?\n---[\r\n]*/);
    if (fmMatch) {
      const fmBlock = fmMatch[1];
      for (const line of fmBlock.split(/\r?\n/)) {
        const m = line.trim().match(/^([\w-]+)\s*:\s*(.+)$/);
        if (m) {
          fm[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
        }
      }
      bodyWithoutFrontmatter = bodyWithoutFrontmatter.slice(fmMatch[0].length);
    }

    let title = fm['title'] || '';
    if (!title) {
      const h1Match = bodyWithoutFrontmatter.match(/^#\s+(.+)$/m);
      if (h1Match) {
        title = this.stripInlineMarkdown(h1Match[1]);
      }
    }

    const description =
      fm['description'] ||
      this.extractExcerpt(bodyWithoutFrontmatter, maxDescriptionLength) ||
      SITE_CONFIG.defaultDescription;

    return {
      title,
      category: fm['category'] || '',
      description,
      bodyWithoutFrontmatter,
    };
  }

  /** Strips inline markdown formatting (`**bold**`, `[[wiki|label]]`, `[link](url)`) into plain text. */
  stripInlineMarkdown(text: string): string {
    if (!text) return '';
    return text
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractExcerpt(markdownBody: string, maxLen: number): string {
    if (!markdownBody) return '';

    const lines = markdownBody.split(/\r?\n/);
    const paragraphLines: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        if (paragraphLines.length > 0) break;
        continue;
      }
      // Skip headings, tables, horizontal rules, code fences, and blockquotes
      if (
        line.startsWith('#') ||
        line.startsWith('|') ||
        line.startsWith('```') ||
        line.startsWith('---') ||
        line.startsWith('>')
      ) {
        continue;
      }
      // Strip bullet markers at start of line
      const cleanedLine = line.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '');
      if (cleanedLine) {
        paragraphLines.push(cleanedLine);
        if (paragraphLines.join(' ').length >= maxLen) {
          break;
        }
      }
    }

    const plain = this.stripInlineMarkdown(paragraphLines.join(' '));
    if (plain.length <= maxLen) {
      return plain;
    }
    const sliced = plain.slice(0, maxLen);
    const lastSpace = sliced.lastIndexOf(' ');
    return (lastSpace > maxLen * 0.6 ? sliced.slice(0, lastSpace) : sliced).trim() + '…';
  }

  private formatTitle(title?: string, rawTitle?: boolean): string {
    if (!title || title.trim() === '' || title.trim() === SITE_CONFIG.name) {
      return SITE_CONFIG.name;
    }
    if (rawTitle || title.includes(SITE_CONFIG.name)) {
      return title.trim();
    }
    return `${title.trim()} — ${SITE_CONFIG.name}`;
  }

  private buildCanonicalUrl(path?: string): string {
    const base = SITE_CONFIG.siteUrl.replace(/\/+$/, '');
    if (!path || path === '/') {
      return `${base}/`;
    }
    const cleanPath = path.split('?')[0].split('#')[0];
    const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${base}${normalized}`;
  }

  private setCanonicalLink(url: string): void {
    if (!this.doc?.head) return;
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
