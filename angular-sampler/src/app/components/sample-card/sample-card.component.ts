import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sample } from '../../preset-service';

@Component({
  selector: 'app-sample-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sample-card.component.html',
  styleUrl: './sample-card.component.css'
})
export class SampleCardComponent {
  @Input() sample!: Sample;
  @Input() presetName!: string;
  @Output() play = new EventEmitter<Sample>();
  @Output() rename = new EventEmitter<Sample>();
  @Output() delete = new EventEmitter<Sample>();

  private audio: HTMLAudioElement | null = null;
  isPlaying = false;

  onPlay() {
    if (!this.audio) {
      const baseUrl = 'https://web-audio-api.onrender.com/presets';
      this.audio = new Audio(`${baseUrl}/${this.sample.url}`);
      this.audio.addEventListener('ended', () => {
        this.isPlaying = false;
      });
    }

    if (this.isPlaying) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
    } else {
      this.audio.play();
      this.isPlaying = true;
    }
  }

  onRename() {
    this.rename.emit(this.sample);
  }

  onDelete() {
    this.delete.emit(this.sample);
  }

  getFilename(): string {
    return this.sample.url.split('/').pop() || '';
  }
}
