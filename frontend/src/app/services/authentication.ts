import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Authentication {
  
  //guardar usuario en la localstorage
  guardarUsuarioSesion(usuario: any): void {
    //hacemos stringfy del objeto usario que pasemos para guardarlo en la localstorage
    const usuarioTexto = JSON.stringify(usuario);
    localStorage.setItem('usuario_castilfac', usuarioTexto);
  }

  //obtener usuario de la localstorage
  obtenerUsuarioSesion(): any {
    //obtenemos el usuario de la localstorage
    const usuarioTexto = localStorage.getItem('usuario_castilfac');
    
    if (usuarioTexto) {
      //lo parseo a json para poder usarlo como objeto
      return JSON.parse(usuarioTexto);
    } else {
      //si no hay nada guardado, devolvemos null
      return null;
    }
  }

  //cerrar sesion
  cerrarSesion(): void {
    //elimino el usuario de la localstorage
    localStorage.removeItem('usuario_castilfac');
  }
  
}
