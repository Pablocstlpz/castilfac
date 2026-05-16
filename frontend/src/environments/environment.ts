// Environment de PRODUCCION.
// Si necesitas valores distintos en desarrollo, usa environment.development.ts
// y configura angular.json -> fileReplacements para sustituir este fichero en
// builds dev.

export const environment = {
  production: true,
  apiUrl: 'https://apicastilfac.pablosrv.com/api',
  // GOOGLE_CLIENT_ID antes estaba hardcodeado en login.ts. Aqui es donde toca.
  googleClientId:
    '795752472198-tk2903qvde156d5d8njdevnc3s3q434p.apps.googleusercontent.com',
};
