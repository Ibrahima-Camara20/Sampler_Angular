import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Preset, Sample, PresetService } from '../preset-service';
import { SampleCardComponent } from '../components/sample-card/sample-card.component';
import { RenameDialogComponent } from '../dialogs/rename-dialog/rename-dialog.component';

@Component({
  selector: 'app-preset-component',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatSnackBarModule,
    SampleCardComponent
  ],
  templateUrl: './preset-component.html',
  styleUrl: './preset-component.css',
})
export class PresetComponent {
  @Input() preset!: Preset;
  @Output() presetUpdated = new EventEmitter<void>();
  
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private presetService = inject(PresetService);

  onRenamePreset() {
    const dialogRef = this.dialog.open(RenameDialogComponent, {
      width: '1000px',
      height: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'futuristic-dialog',
      hasBackdrop: true,
      disableClose: false,
      data: {
        title: 'Rename Preset',
        currentName: this.preset.name,
        type: 'preset'
      }
    });

    dialogRef.afterClosed().subscribe(newName => {
      if (newName && newName !== this.preset.name) {
        this.presetService.updatePreset(this.preset.name, { name: newName }).subscribe({
          next: () => {
            this.snackBar.open('Preset renamed successfully', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
            this.presetUpdated.emit();
          },
          error: (err) => {
            this.snackBar.open(err.error?.error || 'Failed to rename preset', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
          }
        });
      }
    });
  }

  onDeletePreset() {
    if (confirm(`Are you sure you want to delete the preset "${this.preset.name}"?`)) {
      this.presetService.deletePreset(this.preset.name).subscribe({
        next: () => {
          this.snackBar.open('Preset deleted successfully', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
          this.presetUpdated.emit();
        },
        error: (err) => {
          this.snackBar.open(err.error?.error || 'Failed to delete preset', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      });
    }
  }

  onRenameSample(sample: Sample) {
    const dialogRef = this.dialog.open(RenameDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      panelClass: 'futuristic-dialog',
      data: {
        title: 'Rename Sample',
        currentName: sample.name,
        type: 'sample'
      }
    });

    dialogRef.afterClosed().subscribe(newName => {
      if (newName && newName !== sample.name) {
        const filename = sample.url.split('/').pop();
        if (filename) {
          this.presetService.updateSample(this.preset.name, filename, newName).subscribe({
            next: () => {
              this.snackBar.open('Sample renamed successfully', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
              this.presetUpdated.emit();
            },
            error: (err) => {
              this.snackBar.open(err.error?.error || 'Failed to rename sample', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
            }
          });
        }
      }
    });
  }

  onDeleteSample(sample: Sample) {
    const filename = sample.url.split('/').pop();
    if (filename && confirm(`Are you sure you want to delete the sample "${sample.name}"?`)) {
      this.presetService.deleteSample(this.preset.name, filename).subscribe({
        next: () => {
          this.snackBar.open('Sample deleted successfully', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
          this.presetUpdated.emit();
        },
        error: (err) => {
          this.snackBar.open(err.error?.error || 'Failed to delete sample', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      });
    }
  }

  onPlaySample(sample: Sample) {
    // Handled by sample-card component
  }
}
