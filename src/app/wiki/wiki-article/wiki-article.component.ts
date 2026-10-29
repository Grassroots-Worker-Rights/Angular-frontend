import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';
import { switchMap, catchError, map, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { LayoutService } from '../../services/layout.service';
import { WikiService } from '../../services/wiki.service';
import { SeoService } from '../../services/seo.service';
import { SITE_CONFIG } from '../../site-config';
import { environment } from '../../../environments/environment';

const CATEGORY_LABELS: Record<string, string> = {
  adeies: 'Άδειες',
  anergia: 'Ανεργία',
  apolysi: 'Απόλυση & Παραίτηση',
  asfalisi: 'Ασφάλιση & ΕΦΚΑ',
  misthos: 'Μισθός & Δώρα',
  orario: 'Ωράριο & Βάρδιες',
  symvasi: 'Σύμβαση Εργασίας',
  syntaxi: 'Συντάξεις',
  ygeia: 'Υγεία & Ασφάλεια',
  '.': 'Γενικά',
};

@Component({
  selector: 'app-wiki-article',
  standalone: true,
  imports: [MarkdownModule],
  templateUrl: './wiki-article.component.html',
  styleUrls: ['./wiki-article.component.scss'],
})
export class WikiArticleComponent implements OnInit, OnDestroy {
  markdownData: string = '';

  private readonly seoService = inject(SeoService);
  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private layoutService: LayoutService,
    private wikiService: WikiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.layoutService.showSidenav();

    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const folder = params.get('folder') || '.';
          const file = params.get('file') || 'index.md';
          // Root files use folder '.'; the backend serves them without a category segment.
          const rel = folder && folder !== '.' ? `${folder}/${file}` : `${file}`;
          const url = `${environment.apiBaseUrl}/api/wiki/article/${rel}`;
          const routePath = `/wiki/${folder}/${file}`;

          return this.http.get(url, { responseType: 'text' }).pipe(
            map(text => ({ text, folder, file, routePath, isError: false })),
            catchError(() =>
              of({
                text: '# Σφάλμα\nΔεν ήταν δυνατή η φόρτωση του άρθρου.',
                folder,
                file,
                routePath,
                isError: true,
              }),
            ),
          );
        }),
      )
      .subscribe(({ text, folder, file, routePath, isError }) => {
        if (isError) {
          this.seoService.updatePageSeo({
            title: 'Δεν βρέθηκε το άρθρο',
            description: SITE_CONFIG.defaultDescription,
            path: routePath,
            noIndex: true,
          });
          this.markdownData = text;
          this.cdr.detectChanges();
          return;
        }

        const parsedSeo = this.seoService.parseMarkdownSeo(text);
        let parsedText = parsedSeo.bodyWithoutFrontmatter;

        // Parse [[Wiki Links]] and [[Title|Display Text]]
        parsedText = parsedText.replace(/\[\[(.*?)\]\]/g, (_match, inner) => {
          let title = inner;
          let display = inner;
          if (inner.includes('|')) {
            [title, display] = inner.split('|');
          }
          const resolvedPath = this.wikiService.resolveLink(title.trim());
          if (resolvedPath) {
            return `[${display.trim()}](/wiki/${resolvedPath})`;
          }
          return `**${display.trim()}**`; // Dead link fallback
        });

        const categoryKey = parsedSeo.category || folder;
        const categoryLabel = CATEGORY_LABELS[categoryKey] || categoryKey;
        const articleTitle = parsedSeo.title || categoryLabel || 'Οδηγός Δικαιωμάτων';
        const canonicalUrl = `${SITE_CONFIG.siteUrl}${routePath}`;

        const breadcrumbItems: Array<Record<string, unknown>> = [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Αρχική',
            item: `${SITE_CONFIG.siteUrl}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Οδηγός',
            item: `${SITE_CONFIG.siteUrl}/wiki/./index.md`,
          },
        ];

        if (folder !== '.' && file !== 'index.md') {
          breadcrumbItems.push({
            '@type': 'ListItem',
            position: 3,
            name: categoryLabel,
            item: `${SITE_CONFIG.siteUrl}/wiki/${folder}/index.md`,
          });
          breadcrumbItems.push({
            '@type': 'ListItem',
            position: 4,
            name: articleTitle,
            item: canonicalUrl,
          });
        } else if (folder !== '.') {
          breadcrumbItems.push({
            '@type': 'ListItem',
            position: 3,
            name: articleTitle,
            item: canonicalUrl,
          });
        }

        this.seoService.updatePageSeo({
          title: articleTitle,
          description: parsedSeo.description,
          path: routePath,
          type: 'article',
          jsonLd: [
            {
              '@type': 'Article',
              headline: articleTitle,
              description: parsedSeo.description,
              inLanguage: 'el-GR',
              url: canonicalUrl,
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': canonicalUrl,
              },
              articleSection: categoryLabel,
              author: {
                '@type': 'Organization',
                name: SITE_CONFIG.name,
                url: `${SITE_CONFIG.siteUrl}/about`,
              },
              publisher: {
                '@type': 'Organization',
                name: SITE_CONFIG.name,
                logo: {
                  '@type': 'ImageObject',
                  url: SITE_CONFIG.defaultOgImage,
                },
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: breadcrumbItems,
            },
          ],
        });

        this.markdownData = parsedText;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.seoService.removeJsonLd();
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'A') {
      const href = target.getAttribute('href');
      if (href && href.startsWith('/wiki/')) {
        event.preventDefault();
        this.router.navigateByUrl(href);
      }
    }
  }
}
