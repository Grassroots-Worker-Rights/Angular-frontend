import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutService } from '../services/layout.service';
import { ChatLauncherService } from '../services/chat-launcher.service';
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

  readonly siteConfig = SITE_CONFIG;
  readonly hasContact = hasContactInfo();
  /** Params for ABOUT.WHO.P1: url1..url3 follow the order of SITE_CONFIG.organizations. */
  readonly orgUrls = Object.fromEntries(
    SITE_CONFIG.organizations.map((org, i) => [`url${i + 1}`, org.url]),
  );

  ngOnInit(): void {
    this.layoutService.hideSidenav();
  }

  ngOnDestroy(): void {
    this.layoutService.showSidenav();
  }

  openAiChat(): void {
    this.chatLauncher.open();
  }
}
