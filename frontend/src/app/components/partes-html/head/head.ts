import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Authentication } from '../../../services/authentication';
import { AppLanguage, LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-head',
  imports: [RouterLink, NgClass, TranslatePipe],
  templateUrl: './head.html',
  styleUrl: './head.css',
})
export class Head {
  private authentication = inject(Authentication);
  private router = inject(Router);
  private language = inject(LanguageService);

  readonly menuMovilAbierto = signal(false);
  readonly idiomaActual = signal<AppLanguage>('es');

  toggleMenuMovil(): void {
    this.menuMovilAbierto.update((v) => !v);
  }

  cerrarMenuMovil(): void {
    this.menuMovilAbierto.set(false);
  }

  get usuario() {
    return this.authentication.obtenerUsuarioSesion();
  }

  cerrarSesion(): void {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }

  rutaInicio(): string {
    if (this.usuario?.rol === 'admin') {
      return '/inicioadmin';
    } else if (this.usuario?.rol === 'operario') {
      return '/iniciooperario';
    } else {
      return '/';
    }
  }

  constructor() {
    this.idiomaActual.set(this.language.currentLang);
  }

  cambiarIdioma(lang: AppLanguage): void {
    void this.language.setLanguage(lang).then(() => this.idiomaActual.set(lang));
  }
}
