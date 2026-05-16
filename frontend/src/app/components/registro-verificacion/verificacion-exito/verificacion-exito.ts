import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-verificacion-exito',
  standalone: true,
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './verificacion-exito.html',
  // He añadido esta pequeña animación CSS aquí para la barrita del temporizador
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
  private timer: any;

  ngOnInit(): void {
    // Redirección automática tras 6 segundos
    this.timer = setTimeout(() => {
      this.irAlLogin();
    }, 6000);
  }

  ngOnDestroy(): void {
    // Limpieza del timer si el usuario sale antes de la pantalla
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  irAlLogin(): void {
    this.router.navigate(['/login']);
  }
}