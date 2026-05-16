import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Empresa } from '../interfaces/empresa';
import { BaseHttpService } from './base-http.service';

/**
 * Payload del endpoint TRANSACCIONAL POST /api/empresas/registro:
 * crea empresa + admin inicial en una sola transaccion (Bloque 4).
 */
export interface RegistroPayload {
  empresa: Partial<Empresa>;
  admin: { nombre: string; email: string; password: string };
}

@Injectable({ providedIn: 'root' })
export class EmpresasServices extends BaseHttpService {
  getEmpresas(): Observable<Empresa[]> {
    return this.get<Empresa[]>('/empresas');
  }

  getEmpresa(id: number): Observable<Empresa> {
    return this.get<Empresa>(`/empresas/${id}`);
  }

  getEmpresaByNif(nif: string): Observable<Empresa> {
    return this.get<Empresa>(`/empresas/nif/${nif}`);
  }

  /**
   * Endpoint legacy de creacion (sin admin). Lo conservamos por compatibilidad
   * con flujos previos; el formulario de registro usa registroTransaccional.
   */
  addEmpresa(empresa: Empresa): Observable<{ id: number }> {
    return this.post<{ id: number }>('/empresas', empresa);
  }

  /**
   * Registro publico TRANSACCIONAL: crea empresa + admin inicial en una sola
   * peticion atomica. Si falla cualquier paso en el servidor, no queda empresa
   * huerfana ni hace falta el rollback manual del flujo antiguo.
   */
  registroTransaccional(
    payload: RegistroPayload,
  ): Observable<{ message: string; empresa: Empresa }> {
    return this.post<{ message: string; empresa: Empresa }>(
      '/empresas/registro',
      payload,
    );
  }

  updateEmpresa(empresa: Empresa): Observable<{ message: string }> {
    return this.put<{ message: string }>(`/empresas/${empresa.id}`, empresa);
  }

  deleteEmpresa(id: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/empresas/${id}`);
  }

  deleteEmpresaCorreo(correo: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/empresas/correo/${correo}`);
  }

  reenviarVerificacion(email: string): Observable<{ message: string }> {
    return this.post<{ message: string }>('/empresas/reenviar-verificacion', { email });
  }
}
