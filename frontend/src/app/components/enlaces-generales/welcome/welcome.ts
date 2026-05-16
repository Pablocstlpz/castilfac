import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-welcome',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './welcome.html',
  styleUrl: './welcome.css',
})
export class Welcome {

}
