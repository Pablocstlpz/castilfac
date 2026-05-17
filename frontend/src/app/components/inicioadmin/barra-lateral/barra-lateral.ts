import { UpperCasePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Authentication } from '../../../services/authentication';
import { AppLanguage, LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-barra-lateral',
  imports: [MatIcon, RouterLink, RouterLinkActive, TranslatePipe, UpperCasePipe],
  templateUrl: './barra-lateral.html',
  styleUrl: './barra-lateral.css',
})
export class BarraLateral {
  private readonly authentication = inject(Authentication);
  private readonly router = inject(Router);
  private readonly language = inject(LanguageService);

  @Input() menuMovilAbierto = false;
  @Output() cerrarMenu = new EventEmitter<void>();

  readonly usuario = this.authentication.obtenerUsuarioSesion();
  readonly idiomaActual = signal<AppLanguage>('es');

  constructor() {
    this.idiomaActual.set(this.language.currentLang);
  }

  cambiarIdioma(lang: AppLanguage): void {
    void this.language.setLanguage(lang).then(() => this.idiomaActual.set(lang));
  }

  cerrarSesion(): void {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }

  cerrarMenuMovil(): void {
    this.cerrarMenu.emit();
  }
}
