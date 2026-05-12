import { Component } from '@angular/core';
import { BarraLateral } from '../barra-lateral/barra-lateral';
import { RouterModule } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-operario-layout',
  imports: [BarraLateral, RouterModule, MatIcon],
  templateUrl: './operario-layout.html',
  styleUrl: './operario-layout.css',
})
export class OperarioLayout {
  public menuMovilAbierto = false;

  abrirMenuMovil() {
    this.menuMovilAbierto = true;
  }

  cerrarMenuMovil() {
    this.menuMovilAbierto = false;
  }
}
