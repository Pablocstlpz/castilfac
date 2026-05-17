import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-verificacion-exito',
  standalone: true,
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './verificacion-exito.html',
  //animacion CSS para la barrita del temporizador que muestra cuanto queda para redirigir
  styles: [`
    @keyframes progress {
      from { width: 0%; }
      to { width: 100%; }
    }
    .animate-progress-timer {
      animation: progress 6s linear forwards;
    }
  `]
})
export class VerificacionExito {

  private router = inject(Router);
  //referencia al timer para poder limpiarlo si el usuario sale antes de los 6 segundos
  private timer: any;

  ngOnInit(): void {
    //redirijo al login automaticamente a los 6 segundos para que el usuario no se quede mirando la pantalla
    this.timer = setTimeout(() => {
      this.irAlLogin();
    }, 6000);
  }

  ngOnDestroy(): void {
    //limpio el timer si el usuario navega a otra pantalla antes de que se cumpla
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  //funcion para ir al login
  irAlLogin(): void {
    this.router.navigate(['/login']);
  }
}
