import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

import { PedidosServices } from '../../../../services/pedidos';
import { ClientesServices } from '../../../../services/clientes';
import { UsuariosServices } from '../../../../services/usuarios';
import { Authentication } from '../../../../services/authentication';
import { Router } from '@angular/router';

import { Usuario } from '../../../../interfaces/usuario';

//FALTA IMPLEMENTAR TODA LA LOGICA

@Component({
  selector: 'app-detalle-pedido',
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './detalle-pedido.html',
  styleUrl: './detalle-pedido.css',
})
export class DetallePedido {
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  // Servicios (Descomenta cuando los tengas listos)
  private pedidosService = inject(PedidosServices);

  //inyectar servicios de usuarios
  private usuariosService = inject(UsuariosServices);

  //inyectar servicios de autenticacion
  private authentication = inject(Authentication);

  //importar el router para redirigir
  private router = inject(Router);

  //signal de usuarios
  public usuarios = signal<Usuario[]>([]);

  // Signals para almacenar la info
  public pedido = signal<any>(null);
  public elementos = signal<any[]>([]);

  // Variables para inputs rápidos
  public nuevoPago: number = 0;

  ngOnInit(): void {
    //compruebo que haya un usuario logueado
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (usuario === null || usuario.rol !== 'admin') {
      //redirijo a la pagina de no autorizado
      this.router.navigate(['/nopermisos']);
    }

    // 1. Obtenemos el ID de la URL
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.cargarDatosPedido(Number(idParam));
    }

    //cargo los usuarios de la empresa para el select de asignar operario
    this.cargarUsuariosEmpresa(usuario.empresa_id);
  }

  cargarDatosPedido(id: number): void {
    this.pedidosService.getPedido(id).subscribe((data) => {
      this.pedido.set(data);
      // Aquí podrías cargar los elementos del pedido si tu API lo soporta
      // this.pedidosService.getElementosPedido(id).subscribe(elementos => this.elementos.set(elementos));
    });

    const elementosSimulados = [
      {
        id: 1,
        descripcion: 'Ventana Corredera Aluminio Blanco 120x100',
        cantidad: 4,
        estado: 'completado',
      },
      { id: 2, descripcion: 'Puerta Abatible Cristal Templado', cantidad: 1, estado: 'pendiente' },
    ];

    this.elementos.set(elementosSimulados);
  }

  // --- ACCIONES DEL PANEL ---

  volverAtras(): void {
    this.location.back();
  }

  //funcion para cargar a todos los usuarios de la empresa
  cargarUsuariosEmpresa(empresaId: number): void {
    this.usuariosService.getUsuarioPorEmpresa(empresaId).subscribe((usuarios) => {
      console.log(usuarios);
      this.usuarios.set(usuarios);
    });
  }

  cambiarEstado(nuevoEstado: string): void {
    //actualizo el pedido del signal
    this.pedido.update((p) => ({ ...p, estado_fabricacion: nuevoEstado }));

    //actualizo el objeto de la base de datos con el signal
    this.pedidosService.updatePedido(this.pedido()).subscribe((response) => {
      console.log(response.message);
    });
  }

  asignarOperario(event: any): void {
    const nuevoId = event.target.value;
    const p = this.pedido();
    if (p) {
      // Llamada a la API para actualizar el operario
      this.pedido.set({ ...p, operario_asignado_id: Number(nuevoId) });
    }
  }

  registrarPago(): void {
    const p = this.pedido();
    if (p && this.nuevoPago > 0) {
      const totalPagado = p.importe_pagado + this.nuevoPago;
      if (totalPagado <= p.importe_acordado) {
        // Llamada a la API para registrar cobro
        this.pedido.set({ ...p, importe_pagado: totalPagado });
        this.nuevoPago = 0; // Reseteamos el input
      } else {
        alert('El importe pagado no puede superar el total acordado.');
      }
    }
  }

  calcularPorcentajePago(): number {
    const p = this.pedido();
    if (!p || p.importe_acordado === 0) return 0;
    return Math.round((p.importe_pagado / p.importe_acordado) * 100);
  }
}
