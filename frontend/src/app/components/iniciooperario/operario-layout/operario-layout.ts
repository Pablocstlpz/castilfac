import { Component, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AppLanguage, LanguageService } from '../../../services/language.service';
import { BarraLateral } from '../barra-lateral/barra-lateral';

@Component({
  selector: 'app-operario-layout',
  imports: [BarraLateral, RouterModule, MatIcon, TranslatePipe],
  templateUrl: './operario-layout.html',
  styleUrl: './operario-layout.css',
})
export class OperarioLayout {
  private readonly language = inject(LanguageService);

  readonly idiomaActual = signal<AppLanguage>('es');
  public menuMovilAbierto = false;

  constructor() {
    this.idiomaActual.set(this.language.currentLang);
  }

  abrirMenuMovil() {
    this.menuMovilAbierto = true;
  }

  cerrarMenuMovil() {
    this.menuMovilAbierto = false;
  }

  cambiarIdioma(lang: AppLanguage): void {
    void this.language.setLanguage(lang).then(() => this.idiomaActual.set(lang));
  }
}
