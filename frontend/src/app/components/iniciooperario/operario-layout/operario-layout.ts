import { Component } from '@angular/core';
import { BarraLateral } from "../barra-lateral/barra-lateral";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-operario-layout',
  imports: [BarraLateral, RouterModule],
  templateUrl: './operario-layout.html',
  styleUrl: './operario-layout.css',
})
export class OperarioLayout {

}
