import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-planesyprecios',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './planesyprecios.html',
  styleUrl: './planesyprecios.css',
})
export class Planesyprecios {

}
