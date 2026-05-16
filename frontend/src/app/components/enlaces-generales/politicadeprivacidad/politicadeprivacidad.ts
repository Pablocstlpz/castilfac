import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-politicadeprivacidad',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './politicadeprivacidad.html',
  styleUrl: './politicadeprivacidad.css',
})
export class Politicadeprivacidad {

}
