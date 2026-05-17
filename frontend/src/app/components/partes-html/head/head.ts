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

  //controla si el menu hamburguesa de movil esta abierto
  readonly menuMovilAbierto = signal(false);
  //idioma actual de la app para resaltar la bandera en el selector
  readonly idiomaActual = signal<AppLanguage>('es');

  //funcion para abrir o cerrar el menu hamburguesa de movil
  toggleMenuMovil(): void {
    this.menuMovilAbierto.update((v) => !v);
  }

  //funcion para cerrar el menu movil (se llama al pulsar un enlace de dentro)
  cerrarMenuMovil(): void {
    this.menuMovilAbierto.set(false);
  }

  //getter para obtener el usuario en sesion en cada render del template
  get usuario() {
    return this.authentication.obtenerUsuarioSesion();
  }

  //funcion para cerrar sesion y redirigir a la pantalla de sesion cerrada
  cerrarSesion(): void {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }

  //funcion para saber a que pantalla de inicio mandar al usuario segun su rol
  rutaInicio(): string {
    if (this.usuario?.rol === 'admin') {
      return '/inicioadmin';
    } else if (this.usuario?.rol === 'operario') {
      return '/iniciooperario';
    } else {
      //si no hay usuario, lo mando a la home publica
      return '/';
    }
  }

  //inicializo el signal del idioma con el que tenga el servicio en este momento
  constructor() {
    this.idiomaActual.set(this.language.currentLang);
  }

  //funcion para cambiar el idioma de la aplicacion
  cambiarIdioma(lang: AppLanguage): void {
    void this.language.setLanguage(lang).then(() => this.idiomaActual.set(lang));
  }
}
