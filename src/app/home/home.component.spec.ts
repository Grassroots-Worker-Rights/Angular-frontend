import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { HomeComponent, countArticles } from './home.component';
import { ChatLauncherService } from '../services/chat-launcher.service';
import { WikiCategory } from '../services/wiki.service';
import { getSeason } from './season';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let chatLauncher: ChatLauncherService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    chatLauncher = TestBed.inject(ChatLauncherService);
    fixture.detectChanges();
  });

  it('should create HomeComponent and set season', () => {
    expect(component).toBeTruthy();
    expect(component.season()).toEqual(getSeason());
  });

  it('should open chat with question when ask() is called', () => {
    const openSpy = vi.spyOn(chatLauncher, 'open').mockReturnValue(null as any);
    component.question = 'Πόση άδεια δικαιούμαι;';
    component.ask();

    expect(openSpy).toHaveBeenCalledWith('Πόση άδεια δικαιούμαι;');
    expect(component.question).toBe('');
  });

  it('should count articles accurately excluding category index.md', () => {
    const mockCategories: WikiCategory[] = [
      {
        category: 'adeies',
        categoryTitle: 'Άδειες',
        icon: 'event',
        articles: [
          { title: 'Index', path: 'adeies/index.md', tags: [] },
          { title: 'Ετήσια Άδεια', path: 'adeies/etisia.md', tags: [] },
          { title: 'Άδεια Γάμου', path: 'adeies/gamou.md', tags: [] },
        ],
      },
      {
        category: 'misthos',
        categoryTitle: 'Μισθός',
        icon: 'wallet',
        articles: [
          { title: 'Index', path: 'misthos/index.md', tags: [] },
          { title: 'Κατώτατος', path: 'misthos/katotatos.md', tags: [] },
        ],
      },
    ];

    expect(countArticles(mockCategories)).toBe(3);
  });
});
