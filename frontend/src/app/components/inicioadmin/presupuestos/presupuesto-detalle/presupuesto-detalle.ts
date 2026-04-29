import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Presupuesto } from '../../../../interfaces/presupuesto';
import { Presupuestos } from '../../../../services/presupuestos';

@Component({
  selector: 'app-presupuesto-detalle',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './presupuesto-detalle.html',
  styleUrl: './presupuesto-detalle.css',
})
export class PresupuestoDetalle {
  //hacer logica para cargar el presupuesto por id
}
