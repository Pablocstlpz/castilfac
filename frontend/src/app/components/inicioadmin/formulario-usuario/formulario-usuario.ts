import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { ActivatedRoute, Router } from '@angular/router';
import { Usuario } from '../../../interfaces/usuario';
import { UsuariosServices } from '../../../services/usuarios';
import { Authentication } from '../../../services/authentication';

@Component({
  selector: 'app-formulario-usuario',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    MatOptionModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  templateUrl: './formulario-usuario.html',
  styleUrl: './formulario-usuario.css',
})
export class FormularioUsuario {
  public userForm!: FormGroup;
  public hidePassword: boolean = true; // Variable para controlar la visibilidad de la contraseña

  // Inyectamos el servicio Router para poder redirigir al usuario a la página de creación de un nuevo usuario cuando haga clic en el botón "Nuevo Usuario"
  private router = inject(Router); // Inyectamos el servicio Router para poder redirigir al usuario a la página de creación de un nuevo usuario cuando haga clic en el botón "Nuevo Usuario"
  private usuarioServicios = inject(UsuariosServices); // Inyectamos el servicio UsuariosServices para poder utilizar sus métodos y gestionar los usuarios desde este componente, como crear, actualizar o eliminar usuarios.
  private authentication = inject(Authentication); // Inyectamos el servicio Authentication para poder gestionar la autenticación del usuario, como obtener el usuario en sesión o cerrar sesión. Esto es importante para asegurarnos de que solo los usuarios autorizados puedan acceder a este formulario y realizar acciones de gestión de usuarios.
  private snackBar = inject(MatSnackBar); // Inyectamos el servicio MatSnackBar para mostrar notificaciones de éxito o error al crear o actualizar un usuario. Esto mejora la experiencia del usuario al proporcionar retroalimentación inmediata sobre las acciones realizadas.
  private activatedRoute = inject(ActivatedRoute); // Inyectamos el servicio ActivatedRoute para poder obtener los parámetros de la URL
  private id!: number; // Variable para almacenar el ID del usuario que se va a editar, si es que se proporciona en la URL. Si no se proporciona un ID, asumimos que estamos creando un nuevo usuario.

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      id: [''], // Campo para el ID del usuario, se puede usar para editar un usuario existente
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    //compruebo si hay usuario en la sesion
    const usuario = this.authentication.obtenerUsuarioSesion();
    //si el usuario no es admin o no hay usuario en la sesion
    if (usuario === null || usuario.rol !== 'admin') {
      //redirijo a la pagina de no autorizado
      this.router.navigate(['/nopermisos']);
    }

    //extraer parámetros de la URL
    this.activatedRoute.queryParams.subscribe((params) => {
      // Suscribimos a los cambios en los parámetros de la ruta para obtener el ID del usuario que queremos editar, si es que se proporciona. Esto nos permite cargar los datos del usuario en el formulario para su edición. Si no se proporciona un ID, asumimos que estamos creando un nuevo usuario.
      this.id = params['id']; // Asignamos el valor del ID extraído de la URL a la variable id del componente para su uso posterior, como cargar los datos del usuario o actualizarlo.
      if (this.id) {
        this.usuarioServicios.getUsuario(this.id).subscribe({
          next: (response: any) => {
            // Si la petición para obtener los datos del usuario es exitosa, se ejecuta esta función. Aquí puedes cargar los datos del usuario en el formulario para que el usuario pueda editarlos. Por ejemplo, puedes usar this.userForm.patchValue(response) para llenar el formulario con los datos del usuario obtenido de la API.
            // Cargar los datos del usuario en el formulario para su edición
            this.userForm.controls['id'].setValue(response.id);
            this.userForm.controls['nombre'].setValue(response.nombre);
            this.userForm.controls['email'].setValue(response.email);
            this.userForm.controls['password'].setValue(response.password);
          },
        });
      }
    });
  }

  /**getter's */
  get nombre() {
    return this.userForm.get('nombre') as FormControl;
  }
  get email() {
    return this.userForm.get('email') as FormControl;
  }
  get password() {
    return this.userForm.get('password') as FormControl;
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const usuarioSesion = this.authentication.obtenerUsuarioSesion();
    if (!usuarioSesion?.empresa_id) {
      this.router.navigate(['/sesioncerrada']);
      return;
    }

    const usuarioNuevo: Usuario = {
      id: this.userForm.value.id, // El ID se asigna solo si estamos editando un juego existente, para crear un nuevo juego el ID se generará automáticamente en el backend.
      nombre: this.userForm.value.nombre,
      email: this.userForm.value.email,
      password: this.userForm.value.password,
      //llamo a la funcion de autentificacion que devuelve el usuario y cojo el empresa_id
      empresa_id: usuarioSesion.empresa_id,
      rol: 'operario', // Asignamos un valor fijo para el rol del usuario, ya que en este formulario no se está gestionando la selección del rol del usuario. En un escenario real, este valor debería ser dinámico y permitir seleccionar entre diferentes roles como 'admin' u 'operario'.
      activo: true, // Asignamos un valor fijo para indicar que el usuario está activo, ya que en este formulario no se está gestionando la activación o desactivación del usuario. En un escenario real, este valor podría ser dinámico y permitir activar o desactivar el usuario según sea necesario.
      fecha_creacion: new Date(), // Asignamos la fecha actual como fecha de creación del usuario, ya que en este formulario no se está gestionando la fecha de creación. En un escenario real, este valor podría ser generado automáticamente en el backend al crear el usuario.
      fecha_actualizacion: new Date(), // Asignamos la fecha actual como fecha de actualización del usuario, ya que en este formulario no se está gestionando la fecha de actualización. En un escenario real, este valor podría ser generado automáticamente en el backend al actualizar el usuario.
      deleted_at: null, // Asignamos null para indicar que el usuario no ha sido eliminado, ya que en este formulario no se está gestionando la eliminación de usuarios. En un escenario real, este valor podría ser dinámico y permitir marcar al usuario como eliminado si es necesario.
    };

    if (!this.id) {
      // Si no hay un ID en la URL, significa que estamos creando un nuevo juego, por lo que llamamos al método anadirjuego. Si hay un ID, significa que estamos editando un juego existente, por lo que llamamos al método actualizarjuego.
      console.log('añadir');
      this.anadirUsuario(usuarioNuevo);
    } else {
      console.log('actualizar');
      this.actualizarUsuario(usuarioNuevo);
    }
  }

  //funcion para añadir un usuario en la empresa
  anadirUsuario(usuarioNuevo: Usuario): void {
    console.log(this.userForm.value);
    this.usuarioServicios.addUsuario(usuarioNuevo).subscribe({
      next: (response) => {
        // Mostrar también  snackbar
        this.snackBar.open('Usuario creado correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-success'],
        });
        this.userForm.reset();
        this.router.navigate(['/inicioadmin/gestion-personal']);
      },
      error: (error) => {
        console.error('Error al crear usuario:', error);
      },
    });
  }

  actualizarUsuario(usuario: Usuario): void {
    console.log(usuario);
    this.usuarioServicios.updateUsuario(usuario).subscribe({
      next: (response) => {
        // Mostrar también  snackbar
        this.snackBar.open('Usuario actualizado correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-success'],
        });
        this.userForm.reset();
        this.router.navigate(['/inicioadmin/gestion-personal']);
      },
      error: (error) => {
        console.error('Error al actualizar usuario:', error);
      },
    });
  }

  onReset(): void {
    this.userForm.reset();
  }
}
