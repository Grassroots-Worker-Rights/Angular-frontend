import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LayoutService } from '../services/layout.service';
import { ChatLauncherService } from '../services/chat-launcher.service';
import { SeoService } from '../services/seo.service';
import { SITE_CONFIG, hasContactInfo } from '../site-config';

export interface FaqItem {
  id: string;
  q: string;
  a: string[];
  contact?: boolean;
  review?: string;
}

export interface FaqCategory {
  id: string;
  letter: string;
  title: string;
  icon: string;
  items: FaqItem[];
}

export interface FaqData {
  categories: FaqCategory[];
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatSnackBarModule,
    TranslateModule,
  ],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
})
export class FaqComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private layoutService = inject(LayoutService);
  private chatLauncher = inject(ChatLauncherService);
  private seoService = inject(SeoService);

  readonly siteConfig = SITE_CONFIG;
  readonly hasContact = hasContactInfo();

  data = signal<FaqData | null>(null);
  filterQuery = signal('');
  selectedCategory = signal<string>('all');
  activeHash = signal<string>('');
  openedItems = signal<Set<string>>(new Set());

  // Filtered categories and questions
  filteredCategories = computed(() => {
    const d = this.data();
    if (!d) return [];

    const query = this.normalize(this.filterQuery());
    const cat = this.selectedCategory();

    return d.categories
      .filter(c => cat === 'all' || c.id === cat)
      .map(c => {
        const matchingItems = c.items.filter(item => {
          if (!query) return true;
          const qNorm = this.normalize(item.q);
          const aNorm = this.normalize(item.a.join(' '));
          return qNorm.includes(query) || aNorm.includes(query);
        });

        return {
          ...c,
          items: matchingItems,
        };
      })
      .filter(c => c.items.length > 0);
  });

  totalMatchingCount = computed(() => {
    return this.filteredCategories().reduce((acc, c) => acc + c.items.length, 0);
  });

  ngOnInit(): void {
    this.layoutService.hideSidenav();

    this.seoService.updatePageSeo({
      title: 'Συχνές ερωτήσεις',
      description:
        'Συχνές ερωτήσεις και απαντήσεις για εργασιακά δικαιώματα, ωράριο, υπερωρίες, άδειες, δώρα, απολύσεις, συνδικαλισμό και τη χρήση του Εργασιακού Οδηγού Βάσης.',
      path: '/faq',
      type: 'website',
    });

    this.http.get<FaqData>('./assets/content/faq.json').subscribe({
      next: (faq) => {
        this.data.set(faq);
        this.injectJsonLd(faq);
        this.checkInitialHash();
      },
      error: (err) => {
        console.error('Error loading FAQ data', err);
      },
    });

    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        this.activeHash.set(fragment);
        this.openItem(fragment);
      }
    });
  }

  ngOnDestroy(): void {
    this.layoutService.showSidenav();

    // Remove injected JSON-LD when navigating away
    const script = document.getElementById('faq-jsonld');
    if (script) {
      script.remove();
    }
  }

  private normalize(str: string): string {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private checkInitialHash(): void {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      this.activeHash.set(hash);
      setTimeout(() => this.openItem(hash), 150);
    }
  }

  openItem(id: string): void {
    this.openedItems.update(set => {
      const next = new Set(set);
      next.add(id);
      return next;
    });

    setTimeout(() => {
      const element = document.getElementById('faq-item-' + id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  toggleItem(id: string, opened: boolean): void {
    this.openedItems.update(set => {
      const next = new Set(set);
      if (opened) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  isItemOpened(id: string): boolean {
    return this.openedItems().has(id);
  }

  expandAll(): void {
    const allIds = new Set<string>();
    this.filteredCategories().forEach(cat => {
      cat.items.forEach(i => allIds.add(i.id));
    });
    this.openedItems.set(allIds);
  }

  collapseAll(): void {
    this.openedItems.set(new Set());
  }

  selectCategory(catId: string): void {
    this.selectedCategory.set(catId);
  }

  clearSearch(): void {
    this.filterQuery.set('');
  }

  copyLink(id: string, event: Event): void {
    event.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open(this.translate.instant('FAQ.LINK_COPIED'), 'OK', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    });
    this.activeHash.set(id);
    this.router.navigate([], { fragment: id, replaceUrl: true });
  }

  openAiChat(): void {
    this.chatLauncher.open();
  }

  /** Injects Schema.org FAQPage JSON-LD for rich search results */
  private injectJsonLd(faq: FaqData): void {
    const existing = document.getElementById('faq-jsonld');
    if (existing) existing.remove();

    const entities: any[] = [];
    faq.categories.forEach(cat => {
      cat.items.forEach(item => {
        entities.push({
          '@type': 'Question',
          'name': this.seoService.stripInlineMarkdown(item.q),
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': this.seoService.stripInlineMarkdown(item.a.join(' ')),
          },
        });
      });
    });

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': entities,
    };

    const script = document.createElement('script');
    script.id = 'faq-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
}
