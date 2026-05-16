import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-sobrenosotros',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './sobrenosotros.html',
  styleUrl: './sobrenosotros.css',
})
export class Sobrenosotros {

}
