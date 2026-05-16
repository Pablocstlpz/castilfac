import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-feature',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './feature.html',
  styleUrl: './feature.css',
})
export class Feature {

}
