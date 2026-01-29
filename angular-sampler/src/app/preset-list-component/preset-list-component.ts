import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PresetService, Preset } from '../preset-service';
import { PresetComponent } from '../preset-component/preset-component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-preset-list-component',
  standalone: true,
  imports: [CommonModule, PresetComponent],
  templateUrl: './preset-list-component.html',
  styleUrl: './preset-list-component.css',
})
export class PresetListComponent {
  private presetService = inject(PresetService);
  presets$: Observable<Preset[]> = this.presetService.getPresets();
}
