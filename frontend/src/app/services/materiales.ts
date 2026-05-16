import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Material, MaterialConPrecio } from '../interfaces/material';
import { BaseHttpService } from './base-http.service';

@Injectable({ providedIn: 'root' })
export class Materiales extends BaseHttpService {
  getMaterialesConPrecioEmpresa(empresa_id: number): Observable<MaterialConPrecio[]> {
    return this.get<MaterialConPrecio[]>(`/materiales/empresa/${empresa_id}`);
  }

  getMateriales(empresa_id: number): Observable<Material[]> {
    return this.get<Material[]>(`/materiales/empresa/${empresa_id}/lista`);
  }

  getMaterial(empresa_id: number, id: number): Observable<Material> {
    return this.get<Material>(`/materiales/empresa/${empresa_id}/${id}`);
  }

  addMaterial(
    empresa_id: number,
    material: Omit<Material, 'id' | 'fecha_creacion' | 'fecha_actualizacion' | 'deleted_at'>,
  ): Observable<Material> {
    return this.post<Material>(`/materiales/empresa/${empresa_id}`, material);
  }

  updateMaterial(empresa_id: number, material: Material): Observable<Material> {
    return this.put<Material>(`/materiales/empresa/${empresa_id}/${material.id}`, material);
  }

  deleteMaterial(empresa_id: number, id: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/materiales/empresa/${empresa_id}/${id}`);
  }

  toggleActivo(empresa_id: number, id: number): Observable<Material> {
    return this.patch<Material>(`/materiales/empresa/${empresa_id}/${id}/activo`, {});
  }

  actualizarPvpEmpresa(
    material_id: number,
    empresa_id: number,
    usuario_id: number,
    nuevo_precio: number,
  ): Observable<{ message: string; precio_anterior: number; precio_nuevo: number }> {
    return this.put<{ message: string; precio_anterior: number; precio_nuevo: number }>(
      '/precios/actualizar',
      { material_id, empresa_id, usuario_id, nuevo_precio },
    );
  }
}
