import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  AiChatDialogComponent,
  AiChatDialogData,
} from '../ai-chat-dialog/ai-chat-dialog.component';

/** Opens the AI chat dialog with consistent sizing, optionally pre-sending a question. */
@Injectable({ providedIn: 'root' })
export class ChatLauncherService {
  private dialog = inject(MatDialog);

  open(initialQuestion?: string): MatDialogRef<AiChatDialogComponent> {
    return this.dialog.open<AiChatDialogComponent, AiChatDialogData>(AiChatDialogComponent, {
      width: '95vw',
      maxWidth: '700px',
      panelClass: 'chat-dialog-panel',
      data: { initialQuestion: initialQuestion?.trim() || undefined },
    });
  }
}
