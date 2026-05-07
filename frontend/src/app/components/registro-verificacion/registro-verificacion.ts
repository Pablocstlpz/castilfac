import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EmpresasServices } from '../../services/empresas';

@Component({
  selector: 'app-registro-verificacion',
  standalone: true,
  imports: [MatIconModule, MatSnackBarModule],
  templateUrl: './registro-verificacion.html'
})
export class RegistroVerificacion implements OnInit {

  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private empresasService = inject(EmpresasServices);

  public emailEmpresa = signal<string>('');
  public cargando = signal<boolean>(false);

  ngOnInit(): void {
    const email = history.state?.email;
    if (email) {
      this.emailEmpresa.set(email);
    }
  }

  abrirCorreo(): void {
    window.open('mailto:', '_blank');
  }

  reenviarVerificacion(): void {
    const email = this.emailEmpresa();

    if (!email) {
      this.snackBar.open('No se pudo obtener el email. Vuelve a registrarte.', 'Cerrar', {
        duration: 4000,
        panelClass: ['snackbar-error']
      });
      return;
    }

    this.cargando.set(true);

    this.empresasService.reenviarVerificacion(email).subscribe({
      next: () => {
        this.cargando.set(false);
        this.snackBar.open('Enlace de activación reenviado con éxito.', 'Entendido', {
          duration: 4000,
          panelClass: ['snackbar-success']
        });
      },
      error: (err) => {
        this.cargando.set(false);
        this.snackBar.open(err.message || 'Error al reenviar el email.', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }
}
