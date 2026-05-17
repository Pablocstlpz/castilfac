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

  //idioma actual de la aplicacion para resaltar la bandera seleccionada
  readonly idiomaActual = signal<AppLanguage>('es');
  //controla si el menu lateral esta abierto en movil
  public menuMovilAbierto = false;

  //inicializo el signal con el idioma actual del servicio
  constructor() {
    this.idiomaActual.set(this.language.currentLang);
  }

  //funcion para abrir el menu lateral en movil
  abrirMenuMovil() {
    this.menuMovilAbierto = true;
  }

  //funcion para cerrar el menu lateral en movil
  cerrarMenuMovil() {
    this.menuMovilAbierto = false;
  }

  //funcion para cambiar el idioma de la aplicacion
  cambiarIdioma(lang: AppLanguage): void {
    void this.language.setLanguage(lang).then(() => this.idiomaActual.set(lang));
  }
}
