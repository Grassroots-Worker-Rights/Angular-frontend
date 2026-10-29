import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AboutComponent } from './about.component';
import { ChatLauncherService } from '../services/chat-launcher.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AboutComponent', () => {
  let fixture: ComponentFixture<AboutComponent>;
  let component: AboutComponent;
  let chatLauncher: ChatLauncherService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutComponent);
    component = fixture.componentInstance;
    chatLauncher = TestBed.inject(ChatLauncherService);
    fixture.detectChanges();
  });

  it('should create AboutComponent', () => {
    expect(component).toBeTruthy();
    expect(component.siteConfig.name).toBe('Εργασιακός Οδηγός Βάσης');
  });

  it('should call chatLauncher.open when openAiChat() is clicked', () => {
    const openSpy = vi.spyOn(chatLauncher, 'open').mockReturnValue(null as any);
    component.openAiChat();
    expect(openSpy).toHaveBeenCalled();
  });
});
