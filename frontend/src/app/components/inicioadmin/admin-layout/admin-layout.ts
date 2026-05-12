import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { BarraLateral } from '../barra-lateral/barra-lateral';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, BarraLateral, MatIcon],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  public menuMovilAbierto = false;

  abrirMenuMovil() {
    this.menuMovilAbierto = true;
  }

  cerrarMenuMovil() {
    this.menuMovilAbierto = false;
  }
}
