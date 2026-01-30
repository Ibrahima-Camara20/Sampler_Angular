import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PresetService, Preset } from '../../preset-service';

@Component({
  selector: 'app-upload-sample-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './upload-sample-dialog.component.html',
  styleUrl: './upload-sample-dialog.component.css'
})
export class UploadSampleDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<UploadSampleDialogComponent>);
  private presetService = inject(PresetService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  uploadForm!: FormGroup;
  presets: Preset[] = [];
  selectedFile: File | null = null;
  uploading = false;
  presetsLoading = true;

  ngOnInit() {
    this.uploadForm = this.fb.group({
      presetName: [{ value: null, disabled: true }, Validators.required],
      file: [null, Validators.required]
    });

    this.presetService.getPresets().subscribe({
      next: (presets) => {
        this.presets = presets;
        this.presetsLoading = false;
        console.log('Presets loaded:', presets);
        // Enable the select after presets are loaded
        this.uploadForm.get('presetName')?.enable();
      },
      error: (error) => {
        console.error('Error loading presets:', error);
        this.presetsLoading = false;
        const errorMessage = error.error?.error || error.message || 'Failed to load presets';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadForm.patchValue({ file: this.selectedFile });
    }
  }

  onUpload() {
    if (this.uploadForm.valid && this.selectedFile) {
      this.uploading = true;
      const presetName = this.uploadForm.value.presetName;

      this.presetService.uploadSample(presetName, this.selectedFile).subscribe({
        next: (result) => {
          this.dialogRef.close({ success: true, data: result });
        },
        error: (error) => {
          const errorMessage = error.error?.error || error.message || 'Upload failed';
          this.dialogRef.close({ success: false, error: errorMessage });
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
