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
  private apiUrl = 'https://web-audio-api.onrender.com/api';

  /**
   * Presets CRUD
   */

  getPresets(params?: { q?: string, type?: string, factory?: boolean }): Observable<Preset[]> {
    return this.http.get<Preset[]>(`${this.apiUrl}/presets`, { params });
  }

  getPresetByName(name: string): Observable<Preset> {
    return this.http.get<Preset>(`${this.apiUrl}/presets/${name}`);
  }

  createPreset(preset: Preset): Observable<Preset> {
    return this.http.post<Preset>(`${this.apiUrl}/presets`, preset);
  }

  updatePreset(name: string, preset: Partial<Preset>): Observable<Preset> {
    return this.http.patch<Preset>(`${this.apiUrl}/presets/${name}`, preset);
  }

  replacePreset(name: string, preset: Preset): Observable<Preset> {
    return this.http.put<Preset>(`${this.apiUrl}/presets/${name}`, preset);
  }

  deletePreset(name: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/presets/${name}`);
  }

  /**
   * Samples Management
   */

  uploadSample(folderName: string, file: File): Observable<{ uploaded: number, file: Sample }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ uploaded: number, file: Sample }>(`${this.apiUrl}/upload/${folderName}`, formData);
  }

  updateSample(presetName: string, filename: string, newName: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/presets/${presetName}/samples/${filename}`, { name: newName });
  }

  deleteSample(presetName: string, filename: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/presets/${presetName}/samples/${filename}`);
  }
}
