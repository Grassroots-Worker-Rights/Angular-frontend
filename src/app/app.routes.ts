import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Εργασιακός Οδηγός Βάσης',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'wiki',
    redirectTo: 'wiki/./index.md',
    pathMatch: 'full',
  },
  {
    path: 'wiki/:folder/:file',
    loadComponent: () => import('./wiki/wiki-article/wiki-article.component').then(m => m.WikiArticleComponent),
  },
  {
    path: 'tools',
    title: 'Εργαλεία Υπολογισμού — Εργασιακός Οδηγός Βάσης',
    loadComponent: () => import('./tools/tools.component').then(m => m.ToolsComponent),
  },
  {
    path: 'about',
    title: 'Για τον οδηγό — Εργασιακός Οδηγός Βάσης',
    loadComponent: () => import('./about/about.component').then(m => m.AboutComponent),
  },
  {
    path: 'faq',
    title: 'Συχνές ερωτήσεις — Εργασιακός Οδηγός Βάσης',
    loadComponent: () => import('./faq/faq.component').then(m => m.FaqComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
