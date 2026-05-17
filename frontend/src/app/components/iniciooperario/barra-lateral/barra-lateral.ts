import { Component, inject, input, output, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Authentication } from '../../../services/authentication';
import { AppLanguage, LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-barra-lateral',
  imports: [MatIcon, RouterLink, RouterLinkActive, UpperCasePipe, TranslatePipe],
  templateUrl: './barra-lateral.html',
  styleUrl: './barra-lateral.css',
})
export class BarraLateral {
  private readonly authentication = inject(Authentication);
  private readonly router = inject(Router);
  private readonly language = inject(LanguageService);

  //input que recibe del layout para saber si el menu movil esta abierto
  readonly menuMovilAbierto = input<boolean>(false);
  //output para avisar al layout cuando el usuario cierra el menu movil
  readonly cerrarMenu = output<void>();

  //usuario operario en sesion para mostrar su nombre en la barra
  readonly usuario = this.authentication.obtenerUsuarioSesion();
  //idioma actual para resaltar la bandera seleccionada en el selector
  readonly idiomaActual = signal<AppLanguage>('es');

  //inicializo el signal del idioma con el que tenga el servicio en este momento
  constructor() {
    this.idiomaActual.set(this.language.currentLang);
  }

  //funcion para cambiar el idioma de la aplicacion
  cambiarIdioma(lang: AppLanguage): void {
    //actualizo el idioma en el servicio y cuando termine refresco el signal
    void this.language.setLanguage(lang).then(() => this.idiomaActual.set(lang));
  }

  //funcion para cerrar sesion y redirigir a la pantalla de sesion cerrada
  cerrarSesion(): void {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }

  //funcion para emitir el evento de cerrar menu cuando se cierra desde movil
  cerrarMenuMovil(): void {
    this.cerrarMenu.emit();
  }
}
