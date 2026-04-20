import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Cliente } from '../../../interfaces/cliente';
// import { ClientesServices } from '../../../services/clientes';

@Component({
  selector: 'app-clientes',
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes {
  // private clientesService = inject(ClientesServices);

  public clientes = signal<Cliente[]>([]);
  public busqueda = signal<string>('');
  public filtroTipo = signal<string>('todos');

  // Signal computada para filtrar en tiempo real sin llamar a la API constantemente
  public clientesFiltrados = computed(() => {
    return this.clientes().filter((c) => {
      const coincideBusqueda =
        c.nombre_empresa_o_particular.toLowerCase().includes(this.busqueda().toLowerCase()) ||
        c.nif_cif?.toLowerCase().includes(this.busqueda().toLowerCase());
      const coincideTipo = this.filtroTipo() === 'todos' || c.tipo_cliente === this.filtroTipo();
      return coincideBusqueda && coincideTipo;
    });
  });

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    // Simulación de carga. Aquí iría tu: this.clientesService.getClientes().subscribe(...)
    const ejemplo = [
      {
        id: 1,
        nombre_empresa_o_particular: 'Construcciones Garcia SL',
        nif_cif: 'B12345678',
        email: 'info@garcia.com',
        tipo_cliente: 'empresa',
        descuento_fijo: 5,
      },
      {
        id: 2,
        nombre_empresa_o_particular: 'Juan Perez',
        nif_cif: '12345678Z',
        email: 'juan@mail.com',
        tipo_cliente: 'particular',
        descuento_fijo: 0,
      },
      {
        id: 3,
        nombre_empresa_o_particular: 'Hotel Transilvania VIP',
        nif_cif: 'B99887766',
        email: 'admin@hotel.com',
        tipo_cliente: 'vip',
        descuento_fijo: 15,
      },
    ];
    this.clientes.set(ejemplo as any);
  }

  eliminarCliente(id: number): void {
    if (confirm('¿Seguro que quieres eliminar este cliente? Se aplicara borrado logico.')) {
      // this.clientesService.delete(id).subscribe(() => this.cargarClientes());
      this.clientes.set(this.clientes().filter((c) => c.id !== id));
    }
  }
}
