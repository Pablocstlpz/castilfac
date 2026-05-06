import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-stripe-pagos',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './stripe-pagos.html',
  styleUrl: './stripe-pagos.css',
})
export class StripePagos {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private snackBar = inject(MatSnackBar);

  public presupuesto = signal<any>(null);
  public procesando = signal<boolean>(false);

  ngOnInit() {
    // Aquí cargarías el presupuesto real por ID
    this.route.params.subscribe((params) => {
      // Llamada a tu servicio: this.presupuestosService.getById(params['id'])...
      // De momento lo simulamos para el diseño
      this.presupuesto.set({
        numero_presupuesto: 'PRES-202407-0006',
        cliente_nombre: 'Emilio Lara Prieto',
        precio_final: 8001.46,
      });
    });
  }

  simularPago() {
    this.procesando.set(true);

    // Simulamos el tiempo de espera de la pasarela
    setTimeout(() => {
      this.procesando.set(false);
      this.snackBar.open('¡Pago realizado con éxito!', 'OK', { duration: 5000 });
      // Redirigir al éxito o al detalle
      this.router.navigate(['/presupuestos/detalle', 1]);
    }, 3000);
  }

  volver() {
    this.location.back();
  }
}
