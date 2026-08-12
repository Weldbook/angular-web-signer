import { NgModule, ModuleWithProviders, Provider } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WbdEditorRoutingModule } from './wbd-editor-routing.module';
import {
  WbdEditorAnnotateComponent,
  SaveFileNotificationComponent
} from './components';
import { ColorPickerModule } from "ngx-color-picker";
import { PdfJsViewerModule } from "ng2-pdfjs-viewer";
import { CloseFileComponent } from './components/close-file/close-file.component';
import { WbSuggestedEmployeesComponent } from './components/wb-suggested-employees/wb-suggested-employees.component';
import { SignatureInfoComponent } from './components/signature-info/signature-info.component';
import { EditorComponent } from './editor.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { EditorSignerService } from './editor-signer.service';
import {
  WBD_EDITOR_CONFIG,
  WBD_COMMENTS,
  WBD_ANNOTATIONS_OBJECT,
  WBD_DOWNLOAD,
  WBD_EDITOR_ANNOTATES,
} from './editor-tokens';
import { EditorAnnotateModule } from './wb-editor-annotates/src/public-api';

/**
 * Configuration options for WbdEditorModule.
 *
 * @param extraImports - Additional Angular modules to import (e.g., SharedModule, EditorAnnotateModule)
 * @param extraProviders - Additional providers required by the annotation subsystem
 */
export interface WbdEditorConfig {
  /** Base URL for the signer service API */
  signerServiceUrl?: string;
  /** Base API URL for backend endpoints */
  apiUrl?: string;
  extraImports?: any[];
  extraProviders?: Provider[];
}

@NgModule({
  declarations: [
      WbdEditorAnnotateComponent,
      EditorComponent,
      WbSuggestedEmployeesComponent,
      SaveFileNotificationComponent,
      CloseFileComponent,
      SignatureInfoComponent,
  ],
  imports: [
      CommonModule,
      FormsModule,
      WbdEditorRoutingModule,
      ColorPickerModule,
      PdfJsViewerModule,
      MatIconModule,
      MatDialogModule,
      MatButtonModule,
      MatProgressSpinnerModule,
      MatMenuModule,
      MatSliderModule,
      EditorAnnotateModule,
      MatSnackBarModule,
  ],
  providers: [EditorSignerService],
  exports: [
    EditorComponent,
    WbdEditorAnnotateComponent,
    SaveFileNotificationComponent,
    CloseFileComponent,
    WbSuggestedEmployeesComponent,
    SignatureInfoComponent,
  ],
})
export class WbdEditorModule {

  /**
   * Configure WbdEditorModule with runtime options and extra modules/providers.
   *
   * @param config - Configuration object containing URLs, imports, and providers.
   *
   * @example
   * ```ts
   * WbdEditorModule.forRoot({
   *   signerServiceUrl: 'https://signer.example.com',
   *   apiUrl: 'https://api.example.com',
   *   extraImports: [SharedModule],
   *   extraProviders: [
   *     { provide: WBD_EDITOR_ANNOTATES, useExisting: EditorAnnotates },
   *   ],
   * })
   * ```
   */
  static forRoot(config?: WbdEditorConfig): ModuleWithProviders<WbdEditorModule> {
    const imports: any[] = [];
    const providers: Provider[] = [
      {
        provide: WBD_EDITOR_CONFIG,
        useValue: {
          signerServiceUrl: config?.signerServiceUrl || '',
          apiUrl: config?.apiUrl || '',
        },
      },
    ];

    if (config?.extraImports) {
      imports.push(...config.extraImports);
    }
    if (config?.extraProviders) {
      providers.push(...config.extraProviders);
    }

    return {
      ngModule: WbdEditorModule,
      providers,
    };
  }
}
