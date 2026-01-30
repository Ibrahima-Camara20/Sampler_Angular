import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { PresetListComponent } from '../../preset-list-component/preset-list-component';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, PresetListComponent],
  template: `
    <div class="min-h-screen" style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)">
      <app-navbar 
        (presetCreated)="onPresetCreated()"
        (sampleUploaded)="onSampleUploaded()">
      </app-navbar>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <app-preset-list-component></app-preset-list-component>
      </div>
    </div>
  `,
  styles: []
})
export class AdminPageComponent {
  @ViewChild(PresetListComponent) presetList!: PresetListComponent;

  onPresetCreated() {
    this.presetList?.onPresetUpdated();
  }

  onSampleUploaded() {
    this.presetList?.onPresetUpdated();
  }
}
