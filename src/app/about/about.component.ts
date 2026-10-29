import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutService } from '../services/layout.service';
import { ChatLauncherService } from '../services/chat-launcher.service';
import { SeoService } from '../services/seo.service';
import { SITE_CONFIG, hasContactInfo } from '../site-config';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent implements OnInit, OnDestroy {
  private layoutService = inject(LayoutService);
  private chatLauncher = inject(ChatLauncherService);
  private seoService = inject(SeoService);

  readonly siteConfig = SITE_CONFIG;
  readonly hasContact = hasContactInfo();
  /** Params for ABOUT.WHO.P1: url1..url3 follow the order of SITE_CONFIG.organizations. */
  readonly orgUrls = Object.fromEntries(
    SITE_CONFIG.organizations.map((org, i) => [`url${i + 1}`, org.url]),
  );

  ngOnInit(): void {
    this.layoutService.hideSidenav();

    const description =
      'Ποιοι είμαστε και γιατί φτιάξαμε τον Εργασιακό Οδηγό Βάσης: μια ανοιχτή, δωρεάν και συλλογική πρωτοβουλία σωματείων βάσης για τα εργασιακά δικαιώματα.';
    this.seoService.updatePageSeo({
      title: 'Για τον οδηγό',
      description,
      path: '/about',
      type: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: `Για τον οδηγό — ${SITE_CONFIG.name}`,
        description,
        url: `${SITE_CONFIG.siteUrl}/about`,
        inLanguage: 'el-GR',
        mainEntity: {
          '@type': 'Organization',
          name: SITE_CONFIG.name,
          url: `${SITE_CONFIG.siteUrl}/`,
          member: SITE_CONFIG.organizations.map(org => ({
            '@type': 'Organization',
            name: org.name,
            ...(org.url ? { url: org.url } : {}),
          })),
        },
      },
    });
  }

  ngOnDestroy(): void {
    this.layoutService.showSidenav();
    this.seoService.removeJsonLd();
  }

  openAiChat(): void {
    this.chatLauncher.open();
  }
}
