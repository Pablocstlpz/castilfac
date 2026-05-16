import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Pedido } from '../interfaces/pedido';

import { catchError, map, Observable, tap, throwError } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PedidosServices {
  private URL = environment.apiUrl;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      //  'Authorization': `Bearer ${this.token}`
    }),
  };

  private http = inject(HttpClient);

  //OBTENER TODOS LOS PEDIDOS
  getPedidos(): Observable<Pedido[]> {
    // El método getPedidos devuelve un Observable que emitirá un array de objetos Pedido. Este método se encarga de realizar una petición GET al endpoint correspondiente para obtener la lista de pedidos.
    return this.http.get<Pedido[]>(`${this.URL}/pedidos`).pipe(
      map((response) => response), // Aseguramos que la respuesta se trate como un array de Pedido
      catchError(this.handleError),
    );
  }

  //getPedido(id: string): Observable<Pedido> {
  getPedido(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.URL}/pedidos/${id}`).pipe(
      map((response) => response), // Aseguramos que la respuesta se trate como un objeto Pedido
      catchError(this.handleError),
    );
  }

  //BUSCAR PEDIDOS POR ID EMPRESA
  getPedidosByEmpresa(id: number): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.URL}/pedidos/empresa/${id}`).pipe(
      map((response) => response), // Aseguramos que la respuesta se trate como un array de Pedido
      catchError(this.handleError),
    );
  }

  //BUSCAR PEDIDOS POR ID CLIENTE
  getPedidosByCliente(id: number): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.URL}/pedidos/cliente/${id}`).pipe(
      map((response) => response),
      catchError(this.handleError),
    );
  }

  //BUSCAR PEDIDO POR ID OPERARIO
  getPedidosByOperario(id: number): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.URL}/pedidos/operario/${id}`).pipe(
      map((response) => response), // Aseguramos que la respuesta se trate como un array de Pedido
      catchError(this.handleError),
    );
  }

  // addUsuario(usuario: Usuario): Observable<{ id: string }> {
  //   return this.http.post<{ id: string }>(`${this.URL}/usuarios`, usuario, this.httpOptions).pipe(
  //     catchError(this.handleError)
  //   );
  // }

  //updateUsuario(usuario: Usuario): Observable<Usuario> {
  existePedidoDePresupuesto(presupuestoId: number): Observable<{ existe: boolean }> {
    return this.http
      .get<{ existe: boolean }>(`${this.URL}/pedidos/presupuesto/${presupuestoId}`)
      .pipe(catchError(this.handleError));
  }

  createPedido(pedido: any): Observable<{ id: number; message: string }> {
    return this.http
      .post<{ id: number; message: string }>(`${this.URL}/pedidos`, pedido, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updatePedido(pedido: Pedido): Observable<{ message: string }> {
    return this.http
      .put<{ message: string }>(`${this.URL}/pedidos/${pedido.id}`, pedido, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  //deleteUsuario(id: string): Observable<Usuario> {
  deletePedido(id: number): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.URL}/pedidos/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  //MARCAR COMO FABRICADO
  marcarComoFabricado(id: number): Observable<{ message: string }> {
    return this.http
      .put<{ message: string }>(`${this.URL}/pedidos/marcar-fabricado/${id}`, {}, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  //OBTENER DATOS FINANCIEROS DE UNA EMPRESA CON FILTRO TEMPORAL
  getFinanzasPorEmpresa(id: number, rango: 'mes' | 'anio' | 'global'): Observable<Pedido[]> {
    return this.http
      .get<Pedido[]>(`${this.URL}/pedidos/finanzas/empresa/${id}?rango=${rango}`)
      .pipe(catchError(this.handleError));
  }

  //OBTENER TODOS LOS PEDIDOS POR UN OPERARIO
  getPedidosHistorialByOperario(id: number): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.URL}/pedidos/historial/operario/${id}`).pipe(
      map((response) => response), // Aseguramos que la respuesta se trate como un array de Pedido
      catchError(this.handleError),
    );
  }

  // deleteUsuarioCorreo(correo: string): Observable<{ message: string }> {
  //   return this.http.delete<{ message: string }>(`${this.URL}/usuarios/correo/${correo}`, this.httpOptions).pipe(
  //     catchError(this.handleError)
  //   );
  // }

  // getUsuarioCorreoContraseña(correo: string, contraseña: string): Observable<{ message: string, usuario: Usuario }> {
  //   return this.http.post<{ message: string, usuario: Usuario }>(`${this.URL}/usuarios/login`, { correo, contraseña }, this.httpOptions).pipe(
  //     catchError(this.handleError)
  //   );
  // }

  private handleError(error: HttpErrorResponse) {
    console.log(error);

    const errorMessage = error.error?.message || 'Error desconocido al procesar la solicitud';

    return throwError(() => new Error(errorMessage));
  }
}
