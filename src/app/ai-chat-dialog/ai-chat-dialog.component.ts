import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MarkdownModule } from 'ngx-markdown';
import { ChatService } from '../services/chat.service';

export interface AiChatDialogData {
  /** When set, this question is sent as soon as the dialog opens. */
  initialQuestion?: string;
}

@Component({
  selector: 'app-ai-chat-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    TextFieldModule,
    MarkdownModule,
  ],
  templateUrl: './ai-chat-dialog.component.html',
  styleUrls: ['./ai-chat-dialog.component.scss'],
})
export class AiChatDialogComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  userInput = '';

  private data = inject<AiChatDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  constructor(public chatService: ChatService) {}

  ngOnInit(): void {
    const question = this.data?.initialQuestion?.trim();
    if (question) {
      this.chatService.sendMessage(question);
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop =
        this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  sendMessage() {
    if (this.userInput.trim()) {
      this.chatService.sendMessage(this.userInput);
      this.userInput = '';
    }
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
