import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface RenameDialogData {
  title: string;
  currentName: string;
  type: 'preset' | 'sample';
}

@Component({
  selector: 'app-rename-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  template: `
    <div class="bg-gradient-to-br from-slate-800 to-slate-900 p-8 border-2 border-green-500/30 shadow-[0_0_40px_rgba(0,255,136,0.2)] relative flex items-center justify-center min-h-full">
      <!-- Close button -->
      <button 
        (click)="onCancel()"
        class="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 z-10">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
      
      <!-- Centered content wrapper -->
      <div class="w-full max-w-xl">
        <div class="flex items-center space-x-3 mb-6">
          <div class="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-white tracking-wide">{{ data.title }}</h2>
        </div>
        
        <div class="mb-8">
          <label class="block text-sm font-semibold text-green-300 mb-3">New Name</label>
          <input
            type="text"
            [formControl]="nameControl"
            placeholder="Enter new name"
            class="block w-full px-4 py-3 bg-slate-900/50 border-2 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-white placeholder-slate-500 transition-all duration-200 backdrop-blur-sm"
            [class.border-green-500/50]="!nameControl.invalid || !nameControl.touched"
            [class.border-pink-400]="nameControl.invalid && nameControl.touched"
          />
          <p *ngIf="nameControl.hasError('required') && nameControl.touched" class="mt-2 text-sm text-pink-400 flex items-center space-x-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Name is required</span>
          </p>
        </div>

        <div class="flex items-center justify-end gap-6">
          <button
            (click)="onCancel()"
            class="px-6 p-3 m-2 text-sm font-bold text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded-xl hover:bg-slate-600/50 hover:text-white transition-all duration-200">
            CANCEL
          </button>
          <button
            (click)="onSave()"
            [disabled]="!nameControl.valid"
            class="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:from-green-400 hover:to-emerald-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed disabled:text-slate-400 transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(0,255,136,0.4)]">
            RENAME
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class RenameDialogComponent {
  dialogRef = inject(MatDialogRef<RenameDialogComponent>);
  nameControl: FormControl;

  constructor(@Inject(MAT_DIALOG_DATA) public data: RenameDialogData) {
    this.nameControl = new FormControl(data.currentName, [Validators.required]);
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.nameControl.valid) {
      this.dialogRef.close(this.nameControl.value);
    }
  }
}
