import { Routes } from '@angular/router';

export const routes: Routes = [
  // Lazy loading (carga diferida)
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/enlaces-generales/welcome/welcome').then((m) => m.Welcome),
  },
  {
    path: 'sobrenosotros',
    loadComponent: () =>
      import('./components/enlaces-generales/sobrenosotros/sobrenosotros').then(
        (m) => m.Sobrenosotros,
      ),
  },
  {
    path: 'planes-y-precios',
    loadComponent: () =>
      import('./components/enlaces-generales/planesyprecios/planesyprecios').then(
        (m) => m.Planesyprecios,
      ),
  },
  {
    path: 'contacto',
    loadComponent: () =>
      import('./components/enlaces-generales/contacto/contacto').then((m) => m.Contacto),
  },
  {
    path: 'features',
    loadComponent: () =>
      import('./components/enlaces-generales/feature/feature').then((m) => m.Feature),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./components/registro-creacion/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'terminos-y-condiciones',
    loadComponent: () =>
      import('./components/enlaces-generales/terminosycondiciones/terminosycondiciones').then(
        (m) => m.Terminosycondiciones,
      ),
  },
  {
    path: 'politicadeprivacidad',
    loadComponent: () =>
      import('./components/enlaces-generales/politicadeprivacidad/politicadeprivacidad').then(
        (m) => m.Politicadeprivacidad,
      ),
  },
  {
    path: 'creaccioncorrecta',
    loadComponent: () =>
      import('./components/registro-creacion/creaccioncorrecta/creaccioncorrecta').then(
        (m) => m.Creaccioncorrecta,
      ),
  },
  {
    path: 'creacionfallida',
    loadComponent: () =>
      import('./components/registro-creacion/creacionfallida/creacionfallida').then(
        (m) => m.Creacionfallida,
      ),
  },
  {
    path: 'creacionespera',
    loadComponent: () =>
      import('./components/registro-creacion/creacionespera/creacionespera').then(
        (m) => m.Creacionespera,
      ),
  },
  {
    path: 'team',
    loadComponent: () => import('./components/enlaces-generales/team/team').then((m) => m.Team),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login-iniciarsesion/login/login').then((m) => m.Login),
  },
  {
    path: 'company',
    loadComponent: () =>
      import('./components/enlaces-generales/company/company').then((m) => m.Company),
  },
  {
    path: 'sinsubscripcion',
    loadComponent: () =>
      import('./components/nopermitir/sinsubscripcion/sinsubscripcion').then(
        (m) => m.Sinsubscripcion,
      ),
  },
  {
    path: 'nopermisos',
    loadComponent: () =>
      import('./components/nopermitir/nopermisos/nopermisos').then((m) => m.Nopermisos),
  },
  {
    path: 'loginespera',
    loadComponent: () =>
      import('./components/login-iniciarsesion/loginespera/loginespera').then((m) => m.Loginespera),
  },
  {
    path: 'loginfallido',
    loadComponent: () =>
      import('./components/login-iniciarsesion/loginfallido/loginfallido').then(
        (m) => m.Loginfallido,
      ),
  },
  {
    path: 'logincorrecto',
    loadComponent: () =>
      import('./components/login-iniciarsesion/logincorrecto/logincorrecto').then(
        (m) => m.Logincorrecto,
      ),
  },
  {
    path: 'nosubscripcion',
    loadComponent: () =>
      import('./components/nopermitir/nosubscripcion/nosubscripcion').then((m) => m.Nosubscripcion),
  },
  {
    path: 'iniciooperario',
    loadComponent: () =>
      import('./components/iniciooperario/operario-layout/operario-layout').then(
        (m) => m.OperarioLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/iniciooperario/iniciooperario').then((m) => m.Iniciooperario),
      },
      {
        path: 'historial-operario',
        loadComponent: () =>
          import('./components/iniciooperario/historial-completo-operario/historial-completo-operario').then(
            (m) => m.HistorialCompletoOperario,
          ),
      },
    ],
  },
  {
    path: 'inicioadmin',
    loadComponent: () =>
      import('./components/inicioadmin/admin-layout/admin-layout').then((m) => m.AdminLayout),
    //Ruta hija de admin-layout, para que el admin-layout se muestre en todas las paginas de admin,
    //y dentro de admin-layout se muestre el contenido de cada pagina de admin segun la ruta
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/inicioadmin/inicioadmin').then((m) => m.Inicioadmin),
      },
      {
        path: 'presupuestos',
        loadComponent: () =>
          import('./components/inicioadmin/presupuestos/presupuestos').then((m) => m.Presupuestos),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./components/inicioadmin/pedidos/pedidos').then((m) => m.Pedidos),
      },
      {
        path: 'gestion-personal',
        loadComponent: () =>
          import('./components/inicioadmin/gestion-personal/gestion-personal').then(
            (m) => m.GestionPersonal,
          ),
      },
      {
        path: 'formulario-usuario',
        loadComponent: () =>
          import('./components/inicioadmin/formulario-usuario/formulario-usuario').then(
            (m) => m.FormularioUsuario,
          ),
      },
    ],
  },
  {
    path: 'sesioncerrada',
    loadComponent: () =>
      import('./components/sesioncerrada/sesioncerrada').then((m) => m.Sesioncerrada),
  },
  //Ruta 404 no found
  {
    path: '**',
    loadComponent: () =>
      import('./components/nopermitir/noencontrado/pagina404/pagina404').then((m) => m.Pagina404),
  },
];
