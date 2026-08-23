import { Routes } from '@angular/router';
import { Home } from './components/features/home/home';
import { CatalogComponent } from './components/features/catalog-component/catalog-component';
import { BookDetails } from './components/features/book-details/book-details';
import { Login } from './components/features/auth/login/login';
import { Register } from './components/features/auth/register/register';
import { OrderHistory } from './components/features/order-history/order-history';
import { Checkout } from './components/features/checkout/checkout';
import { Profile } from './components/features/profile/profile';
import { DashboardComponent } from './components/features/dashboard-component/dashboard-component';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
    {component: Home, path: ''},
    {component: CatalogComponent, path: 'catalog'},
    {component:BookDetails, path:'book/:id'},
    {component: Login, path: 'login'},
    {component: Register, path: 'register'},
    {component: OrderHistory, path: 'order-history',canActivate: [authGuard]},
    {component: Checkout, path: 'checkout',canActivate: [authGuard]},
    {component: Profile, path: 'profile'},
    {component:DashboardComponent, path:'dashboard',canActivate: [adminGuard]},
    {component: Home, path: '**'} 
];
