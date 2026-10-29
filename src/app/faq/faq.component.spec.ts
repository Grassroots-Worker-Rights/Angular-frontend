import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { FaqComponent, FaqData } from './faq.component';
import { ChatLauncherService } from '../services/chat-launcher.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('FaqComponent', () => {
  let fixture: ComponentFixture<FaqComponent>;
  let component: FaqComponent;
  let chatLauncher: ChatLauncherService;

  const mockFaqData: FaqData = {
    categories: [
      {
        id: 'dikaiomata',
        letter: 'Α',
        title: 'Βασικά εργασιακά δικαιώματα',
        icon: 'gavel',
        items: [
          {
            id: 'nomimi-ergasia',
            q: 'Τι πρέπει να έχω για να είμαι νόμιμα εργαζόμενος/η;',
            a: ['Δήλωση πρόσληψης στο ΕΡΓΑΝΗ ΙΙ.'],
          },
          {
            id: 'ores-ergasias',
            q: 'Πόσες ώρες πρέπει να δουλεύω;',
            a: ['Το νόμιμο εβδομαδιαίο ωράριο είναι 40 ώρες.'],
          },
        ],
      },
      {
        id: 'syndikalismos',
        letter: 'Β',
        title: 'Συνδικαλισμός και σωματεία',
        icon: 'groups',
        items: [
          {
            id: 'ti-einai-somateio',
            q: 'Τι είναι το σωματείο;',
            a: ['Είναι η συλλογική οργάνωση των εργαζομένων.'],
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FaqComponent);
    component = fixture.componentInstance;
    chatLauncher = TestBed.inject(ChatLauncherService);
    component.data.set(mockFaqData);
    fixture.detectChanges();
  });

  it('should create FaqComponent and display all categories initially', () => {
    expect(component).toBeTruthy();
    expect(component.filteredCategories().length).toBe(2);
    expect(component.totalMatchingCount()).toBe(3);
  });

  it('should filter items by search query', () => {
    component.filterQuery.set('ωράριο');
    expect(component.totalMatchingCount()).toBe(1);
    expect(component.filteredCategories()[0].items[0].id).toBe('ores-ergasias');
  });

  it('should filter items by selected category', () => {
    component.selectCategory('syndikalismos');
    expect(component.filteredCategories().length).toBe(1);
    expect(component.totalMatchingCount()).toBe(1);
  });

  it('should expand and collapse all items', () => {
    component.expandAll();
    expect(component.isItemOpened('nomimi-ergasia')).toBe(true);
    expect(component.isItemOpened('ores-ergasias')).toBe(true);
    expect(component.isItemOpened('ti-einai-somateio')).toBe(true);

    component.collapseAll();
    expect(component.isItemOpened('nomimi-ergasia')).toBe(false);
  });

  it('should open AI chat on openAiChat()', () => {
    const openSpy = vi.spyOn(chatLauncher, 'open').mockReturnValue(null as any);
    component.openAiChat();
    expect(openSpy).toHaveBeenCalled();
  });
});
