import { InjectionToken } from '@angular/core';
import { EditorAnnotates } from './wb-editor-annotates/src/lib/editor-annotate/editorAnnotates';

/**
 * Snackbar interface for showing notifications.
 * Provide your own implementation via `WBD_SNACKBAR_SERVICE` token.
 */
export abstract class WbdSnackbarService {
  abstract open(message?: string, action?: string, config?: any): any;
}

/**
 * Injection token for snackbar service.
 * Provide your own implementation in your root module (e.g., MatSnackBar).
 *
 * @example
 * providers: [
 *   { provide: WBD_SNACKBAR_SERVICE, useExisting: MatSnackBar },
 * ]
 */
export const WBD_SNACKBAR_SERVICE = new InjectionToken<WbdSnackbarService>('WBD_SNACKBAR_SERVICE');

/**
 * Runtime configuration for WbdEditorModule.
 * Must be provided via `WBD_EDITOR_CONFIG` token or through `.forRoot()`.
 */
export interface EditorRuntimeConfig {
  /** Base URL for the signer service API */
  signerServiceUrl?: string;
  /** Base API URL for backend endpoints */
  apiUrl?: string;
}

/**
 * Injection token for runtime configuration.
 * Override this in your root module to provide backend URLs.
 *
 * @example
 * providers: [
 *   {
 *     provide: WBD_EDITOR_CONFIG,
 *     useValue: {
 *       signerServiceUrl: 'https://signer.example.com',
 *       apiUrl: 'https://api.example.com',
 *     },
 *   },
 * ]
 */
export const WBD_EDITOR_CONFIG = new InjectionToken<EditorRuntimeConfig>('WBD_EDITOR_CONFIG', {
  factory: () => ({}),
});

/**
 * Annotation registry object.
 * Provide your own instance to manage annotations state externally,
 * or use the default empty object.
 *
 * @example
 * providers: [
 *   { provide: WBD_ANNOTATIONS_OBJECT, useValue: myAnnotationsObject },
 * ]
 */
export const WBD_ANNOTATIONS_OBJECT = new InjectionToken<Record<string, any>>('WBD_ANNOTATIONS_OBJECT', {
  factory: () => ({}),
});

/**
 * Comments registry object.
 * Provide your own instance to manage annotation comments externally.
 *
 * @example
 * providers: [
 *   { provide: WBD_COMMENTS, useValue: myCommentsObject },
 * ]
 */
export const WBD_COMMENTS = new InjectionToken<Record<string, any[]>>('WBD_COMMENTS', {
  factory: () => ({}),
});

/**
 * Download utility function.
 * Provide your own file download implementation.
 *
 * @example
 * providers: [
 *   { provide: WBD_DOWNLOAD, useValue: myDownloadFunction },
 * ]
 */
export const WBD_DOWNLOAD = new InjectionToken<(data: any, filename?: string) => void>('WBD_DOWNLOAD', {
  factory: () => () => { /* no-op */ },
});

/**
 * Editor annotation providers (EditorAnnotates).
 * Provide your own annotation engine instance.
 *
 * @example
 * providers: [
 *   { provide: WBD_EDITOR_ANNOTATES, useClass: MyEditorAnnotates },
 * ]
 */
export const WBD_EDITOR_ANNOTATES = new InjectionToken<EditorAnnotates>('WBD_EDITOR_ANNOTATES');

/**
 * Snackbar component for material notifications.
 * Provide your own snackbar implementation or use Angular Material's MatSnackBar directly.
 */
export const WBD_SNACKBAR_COMPONENT = new InjectionToken<any>('WBD_SNACKBAR_COMPONENT');
