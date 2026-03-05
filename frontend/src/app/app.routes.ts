import { Routes } from '@angular/router';

export const routes: Routes = [
    // Lazy loading (carga diferida)
    {
        path: '',
        loadComponent: () => import('./components/welcome/welcome').then(m => m.Welcome)
    },
    {
        path: 'sobrenosotros',
        loadComponent: () => import('./components/sobrenosotros/sobrenosotros').then(m => m.Sobrenosotros)
    },
    {
        path: 'planes-y-precios',
        loadComponent: () => import('./components/planesyprecios/planesyprecios').then(m => m.Planesyprecios)
    },
    {
        path: 'contacto',
        loadComponent: () => import('./components/contacto/contacto').then(m => m.Contacto)
    },
    {
        path: 'features',
        loadComponent: () => import('./components/feature/feature').then(m => m.Feature)
    },
    {
        path: 'registro',
        loadComponent: () => import('./components/registro/registro').then(m => m.Registro)
    },
    {
        path: 'terminos-y-condiciones',
        loadComponent: () => import('./components/terminosycondiciones/terminosycondiciones').then(m => m.Terminosycondiciones)
    },
    {
        path: 'politicadeprivacidad',
        loadComponent: () => import('./components/politicadeprivacidad/politicadeprivacidad').then(m => m.Politicadeprivacidad)
    },
    {
        path: 'creaccioncorrecta',
        loadComponent: () => import('./components/creaccioncorrecta/creaccioncorrecta').then(m => m.Creaccioncorrecta)
    },
    {
        path: 'creacionfallida',
        loadComponent: () => import('./components/creacionfallida/creacionfallida').then(m => m.Creacionfallida)
    },
    // {
    //     path: 'login',
    //     loadComponent: () => import('./components/login/login').then(m => m.Login)
    // },
    //Ruta 404 no found
    {
        path: '**',
        loadComponent: () => import('./components/pagina404/pagina404').then(m => m.Pagina404)
    },
];