import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  const token = localStorage.getItem('kc_token');

  if (!token) {
    alert('Please log in to access this page.');
    router.navigate(['/']);
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    
  
    console.log('Decoded Token Payload:', payload);
    
    const realmRoles = payload.realm_access?.roles || [];
    
    const resourceAccess = payload.resource_access || {};
    const resourceRoles = Object.values(resourceAccess).flatMap((res: any) => res.roles || []);
    
    const topLevelRoles = Array.isArray(payload.roles) ? payload.roles : 
                         (typeof payload.role === 'string' ? [payload.role] : []);
    
    const allRoles = [...realmRoles, ...resourceRoles, ...topLevelRoles]
                      .map(r => r.toString().toUpperCase());
    
    if (allRoles.includes('ADMIN') || allRoles.includes('ROLE_ADMIN')) {
      return true;
    }

  } catch (error) {
    console.error('Could not decode token to verify roles', error);
  }

  alert('Access Denied: You do not have administrator privileges.');
  router.navigate(['/']);
  return false;
};