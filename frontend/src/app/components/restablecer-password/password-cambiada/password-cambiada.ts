import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-password-cambiada',
  standalone: true,
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './password-cambiada.html'
})
export class PasswordCambiada {

  private router = inject(Router);
  //referencia al timer para limpiarlo si el usuario sale antes de los 8 segundos
  private timer: any;

  ngOnInit(): void {
    //redirijo al login automaticamente tras 8 segundos por si el usuario se queda mirando la pantalla
    this.timer = setTimeout(() => {
      this.irAlLogin();
    }, 8000);
  }

  ngOnDestroy(): void {
    //limpio el timer si el usuario navega manualmente antes de que se cumplan los 8 segundos
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  //funcion para ir al login
  irAlLogin(): void {
    this.router.navigate(['/login']);
  }
}
