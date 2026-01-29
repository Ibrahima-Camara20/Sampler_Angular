import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Sample {
  url: string;
  name: string;
}

export interface Preset {
  name: string;
  type: string;
  isFactoryPresets: boolean;
  samples: Sample[];
}

@Injectable({
  providedIn: 'root',
})
export class PresetService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/presets';

  getPresets(): Observable<Preset[]> {
    return this.http.get<Preset[]>(this.apiUrl);
  }
}
