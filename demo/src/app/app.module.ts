import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import {
  WBD_DOWNLOAD,
  WBD_EDITOR_ANNOTATES,
  WbdEditorModule,
  EditorAnnotateModule,
  EditorAnnotates,
} from '@wbd/editor';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [AppComponent, HomeComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatButtonModule,
    MatCardModule,
    EditorAnnotateModule,
    MatIconModule,
    // AppRoutingModule must be imported BEFORE WbdEditorModule: the library
    // registers its own `''` route (EditorComponent), so our root redirect to
    // the landing page has to win route-order precedence.
    AppRoutingModule,
    // The library is configured here. The demo provides its own annotation
    // engine and a download helper through the tokens the library exposes.
    WbdEditorModule.forRoot({
      signerServiceUrl: '',
      apiUrl: '',
      extraProviders: [
        { provide: WBD_EDITOR_ANNOTATES, useClass: EditorAnnotates },
        {
          provide: WBD_DOWNLOAD,
          useValue: (data: any, filename: string = 'download.pdf') => {
            const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          },
        },
      ],
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
