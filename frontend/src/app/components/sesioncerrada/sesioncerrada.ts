import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-sesioncerrada',
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './sesioncerrada.html',
  styleUrl: './sesioncerrada.css',
})
export class Sesioncerrada {

}
