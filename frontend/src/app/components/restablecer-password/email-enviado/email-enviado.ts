import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UsuariosServices } from '../../../services/usuarios';

@Component({
  selector: 'app-email-enviado',
  standalone: true,
  imports: [MatIconModule, MatSnackBarModule],
  templateUrl: './email-enviado.html'
})
export class EmailEnviado implements OnInit {

  // Inyectamos el router para la navegacion y el snackbar para los avisos al usuario
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  // Inyectamos el servicio UsuariosServices para poder reenviar el correo de recuperacion si el usuario no lo ha recibido
  private usuarioServicios = inject(UsuariosServices);

  // Guardamos el email que viene del state de la navegacion anterior para poder reenviarlo
  private email = '';
  // Variable para evitar que el usuario haga doble click mientras se esta procesando la peticion
  public cargando = signal<boolean>(false);

  ngOnInit(): void {
    //recojo el email que viene del state de la navegacion, lo pasa la pantalla anterior al redirigir aqui
    this.email = history.state?.email || '';
  }

  //redirige al usuario de vuelta al inicio de sesion
  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }

  //reenviar el correo de recuperacion al usuario si no lo ha recibido
  reenviarCorreo(): void {

    //evito que se pueda hacer doble click mientras ya se esta procesando la peticion
    if (this.cargando()) return;

    //activo el estado de carga
    this.cargando.set(true);

    //hago la peticion al backend para que reenvie el correo de recuperacion
    this.usuarioServicios.solicitarRecuperacion(this.email).subscribe({
      next: (response) => {
        console.log(response);
        //desactivo el estado de carga
        this.cargando.set(false);
        //muestro un mensaje de exito al usuario
        this.snackBar.open('¡Correo reenviado! Comprueba de nuevo tu bandeja.', 'Genial', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      },
      error: (error) => {
        //enseño error
        console.error('Error al reenviar el correo de recuperacion:', error);
        //desactivo el estado de carga
        this.cargando.set(false);
        //muestro el mismo mensaje de exito para no revelar si el email existe o no en la base de datos
        this.snackBar.open('¡Correo reenviado! Comprueba de nuevo tu bandeja.', 'Genial', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
  }
}