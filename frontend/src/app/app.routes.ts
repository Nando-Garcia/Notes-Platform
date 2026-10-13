import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'notes',
    loadComponent: () =>
      import('./notes/notes/notes.component').then((m) => m.NotesComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'login' },
];
