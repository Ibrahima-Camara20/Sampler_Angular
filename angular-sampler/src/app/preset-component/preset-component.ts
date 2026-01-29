import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Preset } from '../preset-service';

@Component({
  selector: 'app-preset-component',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './preset-component.html',
  styleUrl: './preset-component.css',
})
export class PresetComponent {
  @Input() preset!: Preset;
}
