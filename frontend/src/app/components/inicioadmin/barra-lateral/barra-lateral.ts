import { Component } from '@angular/core';
import { EventEmitter, Input, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-barra-lateral',
  imports: [MatIcon, RouterLink, RouterLinkActive],
  templateUrl: './barra-lateral.html',
  styleUrl: './barra-lateral.css',
})
export class BarraLateral {
  @Input() menuMovilAbierto = false;
  @Output() cerrarMenu = new EventEmitter<void>();

  cerrarMenuMovil() {
    this.cerrarMenu.emit();
  }
}
