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
  @Input() menuMovilAbierto = false;
  @Output() cerrarMenu = new EventEmitter<void>();

  cerrarMenuMovil() {
    this.cerrarMenu.emit();
  }
}
