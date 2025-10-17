import { Routes } from '@angular/router';
import { ListAgent } from './components/agent/list-agent/list-agent/list-agent';
import { HomeComponent } from './components/home/home-component/home-component';
import { LoginComponent } from './components/login/login-component/login-component';
import { RegisterComponent } from './components/register/register-component/register-component';
import { ReservasComponent } from './components/reservas/reservas-component/reservas-component';
import { VuelosComponent } from './components/vuelos/vuelos-component/vuelos-component';

export const routes: Routes = [
    {path: 'agent', component: ListAgent},
    {path: 'login', component: LoginComponent},
    {path: '', component: HomeComponent},
    {path: 'register', component: RegisterComponent},
    {path: 'reservas', component: ReservasComponent},
    {path: 'vuelos', component: VuelosComponent}
];
