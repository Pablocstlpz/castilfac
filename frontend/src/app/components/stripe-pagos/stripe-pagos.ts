import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Authentication } from '../../services/authentication';
import { StripeServices } from '../../services/stripe';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-stripe-pagos',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatSnackBarModule, TranslatePipe],
  templateUrl: './stripe-pagos.html',
  styleUrl: './stripe-pagos.css',
})
export class StripePagos implements OnInit {
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private auth = inject(Authentication);
  private stripeServices = inject(StripeServices);
  private translate = inject(TranslateService);

  public procesando = signal<boolean>(false);
  public pagoExitoso = signal<boolean>(false);
  private empresa_id: number | null = null;

  ngOnInit() {
    // obtengo el usuario de la sesion para sacar el id de la empresa
    const usuario = this.auth.obtenerUsuarioSesion();
    if (usuario) {
      this.empresa_id = usuario.empresa_id;
    }

    // compruebo si stripe ha redirigido de vuelta con exito para activar la suscripcion
    this.route.queryParams.subscribe((params) => {
      if (params['payment'] === 'success' && params['session_id']) {
        this.verificarSesionEnBackend(params['session_id']);
      }
    });
  }

  private verificarSesionEnBackend(session_id: string) {
    // llamo al backend para que verifique el pago con stripe y active la suscripcion
    this.stripeServices.verificarSesionPago(session_id).subscribe({
      next: () => {
        this.pagoExitoso.set(true);
      },
      error: () => {
        // aunque falle la verificacion muestro el exito (el webhook lo activara igualmente)
        this.pagoExitoso.set(true);
      },
    });
  }

  activarSuscripcion() {
    // valido que haya empresa en sesion antes de llamar a stripe
    if (!this.empresa_id) {
      this.snackBar.open(
        this.translate.instant('stripe.companyNotFound'),
        this.translate.instant('common.ok'),
        { duration: 3000 },
      );
      return;
    }

    this.procesando.set(true);

    // llamo al backend para crear la sesion de checkout y redirijo a stripe
    this.stripeServices.crearSesionCheckout(this.empresa_id).subscribe({
      next: (response) => {
        window.location.href = response.url;
      },
      error: () => {
        this.procesando.set(false);
        this.snackBar.open(
          this.translate.instant('stripe.paymentError'),
          this.translate.instant('common.ok'),
          { duration: 5000 },
        );
      },
    });
  }
}
