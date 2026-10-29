import { Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LayoutService } from '../services/layout.service';
import { WikiService, WikiCategory } from '../services/wiki.service';
import { ChatLauncherService } from '../services/chat-launcher.service';
import { SeoService } from '../services/seo.service';
import { SITE_CONFIG } from '../site-config';
import { Season, getSeason, getSeasonById } from './season';

const COUNT_UP_MS = 1400;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  private layoutService = inject(LayoutService);
  private chatLauncher = inject(ChatLauncherService);
  private wikiService = inject(WikiService);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private seoService = inject(SeoService);

  readonly suggestionKeys = [
    'HOME.HERO.SUGGESTION_1',
    'HOME.HERO.SUGGESTION_2',
    'HOME.HERO.SUGGESTION_3',
  ];

  question = '';

  /** Seasonal highlight; `?season=<id>` overrides the date (handy for previewing). */
  season = signal<Season>(getSeason());

  /** Real article count from the wiki index (0 until/unless it loads). */
  articleCount = signal(0);
  /** Animated values shown in the stats strip. */
  articlesShown = signal(0);
  toolsShown = signal(0);

  private rafIds: number[] = [];

  ngOnInit(): void {
    this.layoutService.hideSidenav();

    this.seoService.updatePageSeo({
      title: SITE_CONFIG.name,
      rawTitle: true,
      description: SITE_CONFIG.defaultDescription,
      path: '/',
      type: 'website',
      jsonLd: [
        {
          '@type': 'WebSite',
          name: SITE_CONFIG.name,
          url: `${SITE_CONFIG.siteUrl}/`,
          inLanguage: 'el-GR',
          description: SITE_CONFIG.defaultDescription,
        },
        {
          '@type': 'Organization',
          name: SITE_CONFIG.name,
          alternateName: SITE_CONFIG.organizationShort,
          url: `${SITE_CONFIG.siteUrl}/`,
          logo: SITE_CONFIG.defaultOgImage,
          sameAs: SITE_CONFIG.organizations.map(org => org.url).filter(Boolean),
          member: SITE_CONFIG.organizations.map(org => ({
            '@type': 'Organization',
            name: org.name,
            ...(org.url ? { url: org.url } : {}),
          })),
        },
      ],
    });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.season.set(getSeasonById(params.get('season')) ?? getSeason());
      });

    this.countUp(SITE_CONFIG.toolCount, v => this.toolsShown.set(v));

    this.wikiService.categories$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(categories => {
        const count = countArticles(categories);
        if (count > 0 && count !== this.articleCount()) {
          this.articleCount.set(count);
          this.countUp(count, v => this.articlesShown.set(v));
        }
      });
  }

  ngOnDestroy(): void {
    this.rafIds.forEach(id => cancelAnimationFrame(id));
    this.layoutService.showSidenav();
    this.seoService.removeJsonLd();
  }

  /** Opens the AI chat; with text it is sent immediately as the first question. */
  ask(text?: string): void {
    const q = (text ?? this.question).trim();
    this.chatLauncher.open(q || undefined);
    this.question = '';
  }

  askSuggestion(key: string): void {
    this.ask(this.translate.instant(key));
  }

  openAiChat(): void {
    this.chatLauncher.open();
  }

  /** Ease-out count from 0 to `target`; jumps straight to the value for reduced motion. */
  private countUp(target: number, set: (v: number) => void): void {
    const reduce =
      typeof window === 'undefined' ||
      typeof requestAnimationFrame === 'undefined' ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      set(target);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_UP_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      set(Math.round(target * eased));
      if (t < 1) this.rafIds.push(requestAnimationFrame(step));
    };
    this.rafIds.push(requestAnimationFrame(step));
  }
}

/** Number of real articles (category landing pages `index.md` are not counted). */
export function countArticles(categories: WikiCategory[]): number {
  return categories.reduce(
    (sum, cat) => sum + cat.articles.filter(a => !a.path.endsWith('index.md')).length,
    0,
  );
}
