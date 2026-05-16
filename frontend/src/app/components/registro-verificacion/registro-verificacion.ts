import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EmpresasServices } from '../../services/empresas';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-registro-verificacion',
  standalone: true,
  imports: [MatIconModule, MatSnackBarModule, TranslatePipe],
  templateUrl: './registro-verificacion.html'
})
export class RegistroVerificacion implements OnInit {

  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private empresasService = inject(EmpresasServices);
  private translate = inject(TranslateService);

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
      this.snackBar.open(
        this.translate.instant('register.emailNotFound'),
        this.translate.instant('common.close'),
        { duration: 4000, panelClass: ['snackbar-error'] },
      );
      return;
    }

    this.cargando.set(true);

    this.empresasService.reenviarVerificacion(email).subscribe({
      next: () => {
        this.cargando.set(false);
        this.snackBar.open(
          this.translate.instant('register.resendSuccess'),
          this.translate.instant('common.understood'),
          { duration: 4000, panelClass: ['snackbar-success'] },
        );
      },
      error: (err) => {
        this.cargando.set(false);
        this.snackBar.open(
          err.message || this.translate.instant('register.resendError'),
          this.translate.instant('common.close'),
          { duration: 4000, panelClass: ['snackbar-error'] },
        );
      }
    });
  }

  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }
}
