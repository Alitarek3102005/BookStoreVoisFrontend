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

export const routes: Routes = [
    {component: Home, path: ''},
    {component: CatalogComponent, path: 'catalog'},
    {component:BookDetails, path:'book/:id'},
    {component: Login, path: 'login'},
    {component: Register, path: 'register'},
    {component: OrderHistory, path: 'order-history'},
    {component: Checkout, path: 'checkout'},
    {component: Profile, path: 'profile'},
    {component:DashboardComponent, path:'dashboard'},
    {component: Home, path: '**'} // Wildcard route for a 404 page or redirect to home
];
