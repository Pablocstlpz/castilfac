
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ActivatedRoute, Router } from '@angular/router';
import { Usuario } from '../../interfaces/usuario';
import { UsuariosServices } from '../../services/usuarios';
import { Empresa } from '../../interfaces/empresa';
import { EmpresasServices } from '../../services/empresas';

@Component({
  selector: 'app-formulario',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, ReactiveFormsModule, MatOptionModule, MatSelectModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  public userForm!: FormGroup;
  public hidePassword: boolean = true; // Variable para controlar la visibilidad de la contraseña
  
  // Inyectamos el servicio Router para poder redirigir al usuario a la página de creación de un nuevo usuario cuando haga clic en el botón "Nuevo Usuario"
  private router = inject(Router); // Inyectamos el servicio Router para poder redirigir al usuario a la página de creación de un nuevo usuario cuando haga clic en el botón "Nuevo Usuario"
  private usuarioServicios = inject(UsuariosServices); // Inyectamos el servicio UsuariosServices para poder utilizar sus métodos y gestionar los usuarios desde este componente, como crear, actualizar o eliminar usuarios. 
  private empresaServicios = inject(EmpresasServices); // Inyectamos el servicio EmpresasServices para poder utilizar sus métodos y gestionar las empresas desde este componente, como crear, actualizar o eliminar empresas. 
  private snackBar = inject(MatSnackBar); // Inyectamos el servicio MatSnackBar para mostrar notificaciones de éxito o error al crear o actualizar un usuario. Esto mejora la experiencia del usuario al proporcionar retroalimentación inmediata sobre las acciones realizadas.
  private activatedRoute = inject(ActivatedRoute); // Inyectamos el servicio ActivatedRoute para poder obtener los parámetros de la URL
  private idUsuario!: number;
  private idEmpresa!: number;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      //parte de las empresas
      nombre_comercial: ['', [Validators.required, Validators.maxLength(150)]],
      razon_social: ['', [Validators.required, Validators.maxLength(150)]],
      nif: ['', [Validators.required, Validators.maxLength(150)]],
      emailEmpresa: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.maxLength(150)]],
      direccion: ['', [Validators.required, Validators.maxLength(150)]],
      codigo_postal: ['', [Validators.required, Validators.maxLength(150)]],
      ciudad: ['', [Validators.required, Validators.maxLength(150)]],
      provincia: ['', [Validators.required, Validators.maxLength(150)]],

      //parte de los usuarios
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      emailUsuario: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  /**getter's */
  //getters de la empresa
  get nombre_comercial() {
    return this.userForm.get('nombre_comercial') as FormControl;
  }
  get razon_social() {
    return this.userForm.get('razon_social') as FormControl;
  }
  get nif() {
    return this.userForm.get('nif') as FormControl;
  }
  get emailEmpresa() {
    return this.userForm.get('emailEmpresa') as FormControl;
  }
  get telefono() {
    return this.userForm.get('telefono') as FormControl;
  }
  get direccion() {
    return this.userForm.get('direccion') as FormControl;
  }
  get codigo_postal() {
    return this.userForm.get('codigo_postal') as FormControl;
  }
  get ciudad() {
    return this.userForm.get('ciudad') as FormControl;
  }
  get provincia() {
    return this.userForm.get('provincia') as FormControl;
  }

  //getters del usuario
  get empresa_id() {
    return this.userForm.get('empresa_id') as FormControl;
  }
  get nombre() {
    return this.userForm.get('nombre') as FormControl;
  }
  get emailUsuario() {
    return this.userForm.get('emailUsuario') as FormControl;
  }
  get password() {
    return this.userForm.get('password') as FormControl;
  }

  onSubmit(): void {
    const empresa: Empresa = {
      id: 0, //se asigna 0 para que el backend lo genere automaticamente
      fecha_registro: new Date(),
      fecha_actualizacion: new Date(),
      nombre_comercial: this.userForm.value.nombre_comercial,
      razon_social: this.userForm.value.razon_social,
      nif: this.userForm.value.nif,
      email: this.userForm.value.emailEmpresa,
      telefono: this.userForm.value.telefono,
      direccion: this.userForm.value.direccion,
      codigo_postal: this.userForm.value.codigo_postal,
      ciudad: this.userForm.value.ciudad,
      provincia: this.userForm.value.provincia,
      suscripcion_activa: false,
      fecha_vencimiento: new Date(),
      activo: true,
      logo_url: ''
    };

    //creacion de la empresa
    this.empresaServicios.addEmpresa(empresa).subscribe({
      next: (response) => {
        console.log(response);
        
        //creacion del usuario (necesito buscar la empresa para el id de la empresa)
    this.empresaServicios.getEmpresaByNif(this.userForm.value.nif).subscribe({
      next: (response) => {
        console.log(response);
        this.idEmpresa = response.id;

        const usuario: Usuario = {
          id: 0,
          empresa_id: this.idEmpresa,
          nombre: this.userForm.value.nombre,
          email: this.userForm.value.emailUsuario,
          password: this.userForm.value.password,
          rol: 'admin',
          activo: true,
          fecha_creacion: new Date(),
          fecha_actualizacion: new Date(),
          deleted_at: null
        };

        this.usuarioServicios.addUsuario(usuario).subscribe({
          next: (response) => {
            console.log(response);
            this.userForm.reset();
            this.router.navigate(['/creaccioncorrecta']);
          },
          error: (error) => {
            console.error('Error al crear usuario:', error);
            this.router.navigate(['/creacionfallida']);
            this.empresaServicios.deleteEmpresaCorreo(this.userForm.value.emailEmpresa).subscribe({
              next: (response) => {
                console.log(response);
              },
              error: (error) => {
                console.error('Error al eliminar empresa:', error);
              }
            });
          }
        });
      },
      error: (error) => {
        console.error('Error al obtener empresa por NIF:', error);
        this.router.navigate(['/creacionfallida']);
        this.empresaServicios.deleteEmpresaCorreo(this.userForm.value.emailEmpresa).subscribe({
          next: (response) => {
            console.log(response);
          },
          error: (error) => {
            console.error('Error al eliminar empresa:', error);
          }
        });
      }
    });
      },
      error: (error) => {
        console.error('Error al crear empresa:', error);
        this.router.navigate(['/creacionfallida']);
      }
    });

    
  }

  onReset(): void {
    this.userForm.reset();
  }

}



