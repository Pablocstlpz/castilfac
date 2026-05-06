import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Authentication } from '../../services/authentication';
import { environment } from '../../../environments/enviroments';

@Component({
  selector: 'app-stripe-pagos',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './stripe-pagos.html',
  styleUrl: './stripe-pagos.css',
})
export class StripePagos implements OnInit {
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private http = inject(HttpClient);
  private auth = inject(Authentication);

  public procesando = signal<boolean>(false);
  public pagoExitoso = signal<boolean>(false);
  private empresa_id: number | null = null;

  ngOnInit() {
    const usuario = this.auth.obtenerUsuarioSesion();
    if (usuario) {
      this.empresa_id = usuario.empresa_id;
    }

    // Detectar retorno exitoso desde Stripe
    this.route.queryParams.subscribe((params) => {
      if (params['payment'] === 'success') {
        this.pagoExitoso.set(true);
      }
    });
  }

  activarSuscripcion() {
    if (!this.empresa_id) {
      this.snackBar.open('No se pudo identificar la empresa', 'OK', { duration: 3000 });
      return;
    }

    this.procesando.set(true);

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    this.http
      .post<{ url: string }>(
        `${environment.apiUrl}/stripe/crear-sesion`,
        { empresa_id: this.empresa_id },
        { headers },
      )
      .subscribe({
        next: (response) => {
          window.location.href = response.url;
        },
        error: () => {
          this.procesando.set(false);
          this.snackBar.open('Error al iniciar el proceso de pago. Inténtalo de nuevo.', 'OK', {
            duration: 5000,
          });
        },
      });
  }
}
