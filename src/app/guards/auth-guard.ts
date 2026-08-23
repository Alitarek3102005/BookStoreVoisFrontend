import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  const token = localStorage.getItem('kc_token');

  if (token) {
    return true; 
  }

  alert('Please log in to access this page.');
  router.navigate(['/']); 
  return false;
};

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
    
    const roles = payload.realm_access?.roles || payload.resource_access?.['account']?.roles || [];
    
    if (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN') || roles.includes('admin')) {
      return true; 
    }
  } catch (error) {
    console.error('Could not decode token to verify roles', error);
  }

  alert('Access Denied: You do not have administrator privileges.');
  router.navigate(['/']);
  return false;
};