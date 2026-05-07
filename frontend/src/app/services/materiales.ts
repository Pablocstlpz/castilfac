import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/enviroments';
import { Material, MaterialConPrecio } from '../interfaces/material';

@Injectable({
  providedIn: 'root',
})
export class Materiales {
  private URL = environment.apiUrl;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  private http = inject(HttpClient);

  getMaterialesConPrecioEmpresa(empresa_id: number): Observable<MaterialConPrecio[]> {
    return this.http
      .get<MaterialConPrecio[]>(`${this.URL}/materiales/empresa/${empresa_id}`)
      .pipe(catchError(this.handleError));
  }

  getMateriales(empresa_id: number): Observable<Material[]> {
    return this.http
      .get<Material[]>(`${this.URL}/materiales/empresa/${empresa_id}/lista`)
      .pipe(map((response) => response), catchError(this.handleError));
  }

  getMaterial(empresa_id: number, id: number): Observable<Material> {
    return this.http
      .get<Material>(`${this.URL}/materiales/empresa/${empresa_id}/${id}`)
      .pipe(catchError(this.handleError));
  }

  addMaterial(
    empresa_id: number,
    material: Omit<Material, 'id' | 'fecha_creacion' | 'fecha_actualizacion' | 'deleted_at'>,
  ): Observable<Material> {
    return this.http
      .post<Material>(`${this.URL}/materiales/empresa/${empresa_id}`, material, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateMaterial(empresa_id: number, material: Material): Observable<Material> {
    return this.http
      .put<Material>(`${this.URL}/materiales/empresa/${empresa_id}/${material.id}`, material, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteMaterial(empresa_id: number, id: number): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.URL}/materiales/empresa/${empresa_id}/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  toggleActivo(empresa_id: number, id: number): Observable<Material> {
    return this.http
      .patch<Material>(`${this.URL}/materiales/empresa/${empresa_id}/${id}/activo`, {}, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  actualizarPvpEmpresa(
    material_id: number,
    empresa_id: number,
    usuario_id: number,
    nuevo_precio: number,
  ): Observable<{ message: string; precio_anterior: number; precio_nuevo: number }> {
    return this.http
      .put<{
        message: string;
        precio_anterior: number;
        precio_nuevo: number;
      }>(`${this.URL}/precios/actualizar`, { material_id, empresa_id, usuario_id, nuevo_precio }, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.log(error);
    const errorMessage = error.error?.message || 'Error desconocido al procesar la solicitud';
    return throwError(() => new Error(errorMessage));
  }
}
