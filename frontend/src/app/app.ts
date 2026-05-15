import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Head } from './components/partes-html/head/head';
import { Footer } from './components/partes-html/footer/footer';

const RUTAS_CON_LAYOUT_PROPIO = ['/inicioadmin', '/iniciooperario'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Head, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private router = inject(Router);

  private urlActual = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly esRutaProtegida = computed(() =>
    RUTAS_CON_LAYOUT_PROPIO.some((ruta) => this.urlActual().startsWith(ruta)),
  );
}
