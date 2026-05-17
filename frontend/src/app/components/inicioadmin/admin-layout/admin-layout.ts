import { Component, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AppLanguage, LanguageService } from '../../../services/language.service';
import { BarraLateral } from '../barra-lateral/barra-lateral';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, BarraLateral, MatIcon, TranslatePipe],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  private readonly language = inject(LanguageService);

  //idioma actual de la app, se usa para resaltar el seleccionado en el selector
  readonly idiomaActual = signal<AppLanguage>('es');
  //controla si el menu lateral esta abierto en movil
  public menuMovilAbierto = false;

  //inicializo el signal con el idioma actual que ya tiene el servicio
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
    //actualizo el idioma en el servicio y cuando termine actualizo el signal para que el selector se refresque
    void this.language.setLanguage(lang).then(() => this.idiomaActual.set(lang));
  }
}
