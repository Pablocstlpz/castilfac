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

  //input que recibe del layout para saber si el menu movil esta abierto
  @Input() menuMovilAbierto = false;
  //output para avisar al layout de que el usuario quiere cerrar el menu movil
  @Output() cerrarMenu = new EventEmitter<void>();

  //usuario actual en sesion, lo uso para mostrar el nombre en la barra
  readonly usuario = this.authentication.obtenerUsuarioSesion();
  //idioma actual de la aplicacion, se usa para resaltar la bandera seleccionada
  readonly idiomaActual = signal<AppLanguage>('es');

  //inicializo el signal del idioma con el que tenga el servicio en este momento
  constructor() {
    this.idiomaActual.set(this.language.currentLang);
  }

  //funcion para cambiar el idioma de la aplicacion
  cambiarIdioma(lang: AppLanguage): void {
    //actualizo el idioma en el servicio y cuando termine refresco el signal para que se vea el cambio
    void this.language.setLanguage(lang).then(() => this.idiomaActual.set(lang));
  }

  //funcion para cerrar la sesion y redirigir al usuario a la pantalla de sesion cerrada
  cerrarSesion(): void {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }

  //funcion para emitir el evento de cerrar menu cuando el usuario lo cierra desde movil
  cerrarMenuMovil(): void {
    this.cerrarMenu.emit();
  }
}
