// Environment de DESARROLLO.
// Para activarlo, en angular.json (configurations.development) anade:
//   "fileReplacements": [
//     { "replace": "src/environments/environment.ts",
//       "src":     "src/environments/environment.development.ts" }
//   ]

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  // En desarrollo puedes seguir usando el mismo Client ID (Google permite
  // multiples origenes), o crear uno distinto en Google Cloud Console.
  googleClientId:
    '795752472198-tk2903qvde156d5d8njdevnc3s3q434p.apps.googleusercontent.com',
};
