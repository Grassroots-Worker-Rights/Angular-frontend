import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { SeoService } from './seo.service';
import { SITE_CONFIG } from '../site-config';

describe('SeoService', () => {
  let service: SeoService;
  let titleService: Title;
  let metaService: Meta;
  let doc: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoService);
    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
    doc = TestBed.inject(DOCUMENT);
  });

  it('updates title, meta description, canonical link, and Open Graph tags', () => {
    service.updatePageSeo({
      title: 'Άδεια Γάμου & Τεκνοποίησης',
      description: 'Όλα όσα πρέπει να γνωρίζεις για την άδεια γάμου.',
      path: '/wiki/adeies/adia-gamos.md',
      type: 'article',
    });

    expect(titleService.getTitle()).toBe(
      `Άδεια Γάμου & Τεκνοποίησης — ${SITE_CONFIG.name}`,
    );
    expect(metaService.getTag("name='description'")?.content).toBe(
      'Όλα όσα πρέπει να γνωρίζεις για την άδεια γάμου.',
    );
    expect(metaService.getTag("property='og:type'")?.content).toBe('article');
    expect(metaService.getTag("property='og:url'")?.content).toBe(
      'https://ergasiakos-odigos.gr/wiki/adeies/adia-gamos.md',
    );

    const canonical = doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe(
      'https://ergasiakos-odigos.gr/wiki/adeies/adia-gamos.md',
    );
  });

  it('strips query params and hash fragments from canonical URLs', () => {
    service.updatePageSeo({
      title: SITE_CONFIG.name,
      path: '/tools?season=easter#salary',
    });

    const canonical = doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('https://ergasiakos-odigos.gr/tools');
  });

  it('parses YAML frontmatter and extracts clean plain-text description from markdown', () => {
    const md = `---
title: Άδεια Γάμου & Τεκνοποίησης
category: adeies
---

# Άδεια Γάμου & Τεκνοποίησης

## Άδεια γάμου / συμφώνου συμβίωσης

Αν παντρεύεσαι ή συνάπτεις **σύμφωνο συμβίωσης**, δικαιούσαι ειδική άδεια με πλήρεις αποδοχές χωρίς μείωση από την [[Ετήσια Άδεια]].
`;

    const parsed = service.parseMarkdownSeo(md);
    expect(parsed.title).toBe('Άδεια Γάμου & Τεκνοποίησης');
    expect(parsed.category).toBe('adeies');
    expect(parsed.description).toContain(
      'Αν παντρεύεσαι ή συνάπτεις σύμφωνο συμβίωσης, δικαιούσαι ειδική άδεια',
    );
    expect(parsed.description).not.toContain('**');
    expect(parsed.description).not.toContain('[[');
  });

  it('injects and cleans up JSON-LD scripts', () => {
    service.updatePageSeo({
      title: 'Test',
      path: '/',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_CONFIG.name,
      },
    });

    const script = doc.getElementById('seo-jsonld') as HTMLScriptElement | null;
    expect(script).toBeTruthy();
    expect(JSON.parse(script!.text)['@type']).toBe('WebSite');

    service.removeJsonLd();
    expect(doc.getElementById('seo-jsonld')).toBeNull();
  });
});
