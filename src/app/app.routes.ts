import { Routes } from '@angular/router';
import { ListAgent } from './components/agent/list-agent/list-agent/list-agent';
import { HomeComponent } from './components/home/home-component/home-component';

export const routes: Routes = [
    {path: 'agent', component: ListAgent},
    {path: '', component: HomeComponent}
];
