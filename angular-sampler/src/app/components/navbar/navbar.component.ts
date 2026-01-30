import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UploadSampleDialogComponent } from '../../dialogs/upload-sample-dialog/upload-sample-dialog.component';
import { CreatePresetDialogComponent } from '../../dialogs/create-preset-dialog/create-preset-dialog.component';
import { PresetService } from '../../preset-service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatSnackBarModule],
  template: `
    <nav class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-[0_4px_20px_rgba(0,255,136,0.15)] sticky top-0 z-50 border-b-2 border-green-500/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pl-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-4">
            <div class="bg-gradient-to-br from-green-500 to-emerald-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(0,255,136,0.4)]">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3">
                </path>
              </svg>
            </div>
            <div>
              <span class="text-white font-bold text-xl tracking-wide">Audio Sampler</span>
              <span class="text-green-400 text-sm font-semibold ml-2">ADMIN</span>
            </div>
          </div>
          <div class="flex gap-6">
            <button 
              (click)="openCreatePresetDialog()"
              class="group flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transform hover:scale-105 transition-all duration-300">
              <svg class="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              <span class="font-bold">ADD PRESET</span>
            </button>
            <button 
              (click)="openUploadDialog()"
              class="group flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-[0_0_25px_rgba(0,255,136,0.5)] transform hover:scale-105 transition-all duration-300">
              <svg class="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              <span class="font-bold">ADD SAMPLE</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: []
})
export class NavbarComponent {
  @Output() presetCreated = new EventEmitter<void>();
  @Output() sampleUploaded = new EventEmitter<void>();
  
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private presetService = inject(PresetService);

  openCreatePresetDialog() {
    const dialogRef = this.dialog.open(CreatePresetDialogComponent, {
      width: '800px',
      height: '300px',
      maxWidth: '95vw',
      panelClass: 'futuristic-dialog',
      hasBackdrop: true,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newPreset = {
          name: result.name,
          type: result.type,
          isFactoryPresets: false,
          samples: []
        };

        this.presetService.createPreset(newPreset).subscribe({
          next: (preset) => {
            this.snackBar.open(`Preset "${preset.name}" created successfully!`, 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.presetCreated.emit();
          },
          error: (error) => {
            const errorMessage = error.error?.error || error.message || 'Failed to create preset';
            this.snackBar.open(errorMessage, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  openUploadDialog() {
    const dialogRef = this.dialog.open(UploadSampleDialogComponent, {
      width: '800px',
      height: '300px',
      maxWidth: '95vw',
      panelClass: 'futuristic-dialog',
      hasBackdrop: true,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open(`Sample "${result.data.file.name}" uploaded successfully!`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.sampleUploaded.emit(); // Rafraîchir la liste
      } else if (result?.error) {
        this.snackBar.open(result.error, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
