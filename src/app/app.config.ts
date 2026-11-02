import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader, TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader';
import { provideMarkdown } from 'ngx-markdown';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideMarkdown(),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'el',
        loader: {
          provide: TranslateLoader,
          useClass: TranslateHttpLoader,
        },
      })
    ),
    {
      provide: TRANSLATE_HTTP_LOADER_CONFIG,
      // "?v=" changes the URL so browsers drop copies of el.json cached before nginx sent
      // Cache-Control for /assets/. Bump it only if that ever happens again; nginx's no-cache keeps
      // the file fresh on normal deploys.
      useValue: { prefix: './assets/i18n/', suffix: '.json?v=2' },
    },
  ],
};
