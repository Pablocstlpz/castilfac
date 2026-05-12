import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Welcome } from './components/enlaces-generales/welcome/welcome';
import { Head } from './components/partes-html/head/head';
import { Footer } from './components/partes-html/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Head, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('frontend');
}
