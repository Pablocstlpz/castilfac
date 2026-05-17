import { UpperCasePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-barra-lateral',
  imports: [MatIcon, RouterLink, RouterLinkActive, TranslatePipe, UpperCasePipe],
  templateUrl: './barra-lateral.html',
  styleUrl: './barra-lateral.css',
})
export class BarraLateral {
  //input que recibe del layout para saber si el menu movil esta abierto
  @Input() menuMovilAbierto = false;
  //output para avisar al layout de que el usuario quiere cerrar el menu movil
  @Output() cerrarMenu = new EventEmitter<void>();

  //funcion para emitir el evento de cerrar menu al pulsar fuera o en la X
  cerrarMenuMovil() {
    this.cerrarMenu.emit();
  }
}
