import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { 
  provideKeycloak, 
  createInterceptorCondition,
  IncludeBearerTokenCondition, 
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG, 
  includeBearerTokenInterceptor 
} from 'keycloak-angular';

const springBootApiCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
  urlPattern: /^(http:\/\/localhost:8080)(\/.*)?$/i
});

// Safely retrieve tokens to bypass strict browser SameSite cookie blocking in dev mode
const storedToken = localStorage.getItem('kc_token');
const storedRefreshToken = localStorage.getItem('kc_refresh_token');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    
    provideHttpClient(withInterceptors([includeBearerTokenInterceptor])),
    
    provideKeycloak({
      config: {
        url: 'http://localhost:8081', 
        realm: 'bookstore-realm',    
        clientId: 'bookstore-frontend'
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
        checkLoginIframe: false,
        // Inject the saved tokens directly into Keycloak's boot sequence
        token: storedToken ? storedToken : undefined,
        refreshToken: storedRefreshToken ? storedRefreshToken : undefined
      },
      providers: [
        {
          provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
          useValue: [springBootApiCondition]
        }
      ]
    })
  ]
};