import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

//componente reutilizable que muestra un overlay con spinner mientras se cargan datos
//se posiciona en absolute por lo que el contenedor padre debe tener position relative
@Component({
  selector: 'app-spinner-carga-datos',
  imports: [TranslatePipe],
  templateUrl: './spinner-carga-datos.html',
})
export class SpinnerCargaDatos {
  //input para controlar si se muestra el overlay (true mientras se cargan los datos)
  readonly cargando = input<boolean>(false);
  //clave i18n del mensaje que se muestra debajo del spinner (por defecto "Cargando...")
  readonly mensajeKey = input<string>('common.loading');
}
