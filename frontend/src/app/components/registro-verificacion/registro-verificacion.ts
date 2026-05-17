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

  //signal con el email de la empresa que se acaba de registrar, lo muestro en pantalla y lo uso para reenviar
  public emailEmpresa = signal<string>('');
  //flag para deshabilitar el boton de reenvio mientras se procesa la peticion
  public cargando = signal<boolean>(false);

  ngOnInit(): void {
    //recojo el email del state de la navegacion, lo pasa la pantalla de registro al redirigir aqui
    const email = history.state?.email;
    if (email) {
      this.emailEmpresa.set(email);
    }
  }

  //funcion para abrir el cliente de correo por defecto del sistema operativo
  abrirCorreo(): void {
    window.open('mailto:', '_blank');
  }

  //funcion para reenviar el correo de verificacion al usuario si no lo ha recibido
  reenviarVerificacion(): void {
    const email = this.emailEmpresa();

    //si por algun motivo no tengo el email, aviso al usuario y no hago nada
    if (!email) {
      this.snackBar.open(
        this.translate.instant('register.emailNotFound'),
        this.translate.instant('common.close'),
        { duration: 4000, panelClass: ['snackbar-error'] },
      );
      return;
    }

    //activo el estado de carga para deshabilitar el boton
    this.cargando.set(true);

    //llamo al backend para que reenvie el correo de verificacion
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

  //funcion para volver al login
  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }
}
