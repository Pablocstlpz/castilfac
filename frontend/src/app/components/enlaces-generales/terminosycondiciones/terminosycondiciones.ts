import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-terminosycondiciones',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './terminosycondiciones.html',
  styleUrl: './terminosycondiciones.css',
})
export class Terminosycondiciones {

}
