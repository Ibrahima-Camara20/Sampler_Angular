import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PresetService, Preset, Sample } from '../preset-service';
import { PresetComponent } from '../preset-component/preset-component';
import { Observable, BehaviorSubject, debounceTime, distinctUntilChanged, startWith, switchMap, tap, combineLatest } from 'rxjs';

@Component({
  selector: 'app-preset-list-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PresetComponent,
    MatProgressBarModule
  ],
  templateUrl: './preset-list-component.html',
  styleUrl: './preset-list-component.css',
})
export class PresetListComponent implements OnInit {
  private presetService = inject(PresetService);
  
  searchControl = new FormControl('');
  factoryFilter = new FormControl('all');
  loading = false;
  
  // Subject to trigger manual refresh
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);
  
  presets$!: Observable<Preset[]>;

  ngOnInit() {
    this.presets$ = combineLatest([
      this.searchControl.valueChanges.pipe(startWith('')),
      this.factoryFilter.valueChanges.pipe(startWith(this.factoryFilter.value)),
      this.refreshTrigger$
    ]).pipe(
      debounceTime(300),
      tap(() => this.loading = true),
      switchMap(([query, factory]) => {
        const params: any = { q: query };
        if (factory === 'factory') params.factory = true;
        if (factory === 'user') params.factory = false;
        return this.presetService.getPresets(params).pipe(
          tap(() => this.loading = false)
        );
      })
    );
  }

  onPresetUpdated() {
    // Trigger a refresh by emitting on the refresh subject
    this.refreshTrigger$.next();
  }
}
