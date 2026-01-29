import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PresetListComponent } from './preset-list-component/preset-list-component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PresetListComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('angular-sampler');
}
