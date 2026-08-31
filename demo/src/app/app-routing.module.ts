import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EditorComponent } from '@wbd/editor';

import { HomeComponent } from './home/home.component';

import { DiTestComponent } from './di-test/di-test.component';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'di-test', component: DiTestComponent },
  // The editor's own routing module also registers a '' route for EditorComponent,
  // so redirecting the root path away keeps the landing page on Home.
  { path: 'editor', component: EditorComponent },
  { path: 'documents', component: HomeComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
