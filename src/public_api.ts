/*
 * Public API surface of wbd-editor library.
 * Everything exported here is available to consumers of the package.
 */

// Module
export { WbdEditorModule, WbdEditorConfig } from './wbd-editor.module';

// Main Component
export { EditorComponent } from './editor.component';

// Document Model
export {
  EditorDocument,
  EditorDocumentSourceType,
  FileLink,
} from './editor-document';

// Services
export { EditorSignerService, DataFileForSign, SignatureObject } from './editor-signer.service';
export { VisibleSignaturePlacer } from './signer/visible-signature-placer';
export { PdfVisibleSignaturePlacer } from './signer/pdf-visible-signature-placer';
export { SignerSettingsService } from './signer/signer-settings.service';
export { SignatureType, SignerSettings, SIGNER_SETTINGS_DEFAULTS } from './signer/signer-settings';

// Injection Tokens and Abstract Classes (for consumer providers)
export {
  WBD_EDITOR_CONFIG,
  WBD_COMMENTS,
  WBD_ANNOTATIONS_OBJECT,
  WBD_DOWNLOAD,
  WBD_EDITOR_ANNOTATES,
  WBD_SNACKBAR_COMPONENT,
  WBD_SNACKBAR_SERVICE,
  WBD_VISIBLE_SIGNATURE_PLACER,
  WbdSnackbarService,
  EditorRuntimeConfig,
} from './editor-tokens';

// Sub-components
export { WbdEditorAnnotateComponent } from './components/wbd-edtitor-annotate/wbd-editor-annotate.component';
export { SaveFileNotificationComponent } from './components/save-file-notification/save-file-notification.component';
export { CloseFileComponent } from './components/close-file/close-file.component';
export { WbSuggestedEmployeesComponent } from './components/wb-suggested-employees/wb-suggested-employees.component';
export { SignatureInfoComponent } from './components/signature-info/signature-info.component';
export { SettingsComponent } from './components/settings/settings.component';
export * from './wb-editor-annotates/src/public-api';
