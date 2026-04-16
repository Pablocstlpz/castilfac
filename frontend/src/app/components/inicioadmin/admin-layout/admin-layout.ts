import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BarraLateral } from '../barra-lateral/barra-lateral';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, BarraLateral],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {}
