import { LOCALE_ID } from '@angular/core';
import { ApplicationConfig } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { requestInterceptor } from './core/interceptors/request.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([requestInterceptor, loadingInterceptor, errorInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-ES' }
  ]
};
