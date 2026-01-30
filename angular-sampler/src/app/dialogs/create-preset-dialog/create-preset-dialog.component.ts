import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-create-preset-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './create-preset-dialog.component.html',
  styleUrl: './create-preset-dialog.component.css'
})
export class CreatePresetDialogComponent {
  private dialogRef = inject(MatDialogRef<CreatePresetDialogComponent>);
  private fb = inject(FormBuilder);

  presetForm!: FormGroup;

  ngOnInit() {
    this.presetForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      type: ['custom', Validators.required]
    });
  }

  onCreate() {
    if (this.presetForm.valid) {
      this.dialogRef.close({
        name: this.presetForm.value.name,
        type: this.presetForm.value.type
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
