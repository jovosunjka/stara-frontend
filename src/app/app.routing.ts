import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';
import { HomePageComponent } from './core/home-page/home-page.component';
import { EditorComponent } from './editor/editor.component';

const routes: Routes = [
    { path: 'home-page', component: HomePageComponent },
    { path: 'editor', component: EditorComponent },
    {
        path: '', // localhost:4200 redirect to localhost:4200/home-page
        redirectTo: '/home-page',
        pathMatch: 'full'
    },
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
