import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-pagina404',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './pagina404.html',
  styleUrl: './pagina404.css',
})
export class Pagina404 {

}
