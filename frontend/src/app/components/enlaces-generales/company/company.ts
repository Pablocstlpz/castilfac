import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-company',
  imports: [TranslatePipe],
  templateUrl: './company.html',
  styleUrl: './company.css',
})
export class Company {

}
