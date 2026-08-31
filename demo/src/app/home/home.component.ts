import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EditorDocument, EditorDocumentSourceType } from '@wbd/editor';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  readonly sourceType: any = [
    'FileLink',
    'ArrayBuffer',
    'Uint16Array',
    'Blob'
  ];
  readonly currentEditorFiles = this.readEditorFiles();

  readonly features = [
    {
      icon: 'gesture',
      title: 'Annotation tools',
      description:
        'Pen, highlight, text, rectangle, line, comment and signature / stamp placeholders drawn as SVG overlays that stay aligned on zoom.',
    },
    {
      icon: 'verified_user',
      title: 'CAdES digital signatures',
      description:
        'Certificate listing, GOST hashing, detached signatures, TSP timestamping, verification and visual signature placement via crypto-pro.',
    },
    {
      icon: 'extension',
      title: 'Extension points',
      description:
        'File storage, annotation engine, snackbar and download helpers are injected through tokens, so the library plugs into any backend.',
    },
    {
      icon: 'picture_as_pdf',
      title: 'PDF.js viewer',
      description:
        'Documents render inside an embedded PDF.js viewer powered by ng2-pdfjs-viewer, with page zoom and multi-page navigation.',
    },
  ];

  constructor(public router: Router) {}

  openEditor(source: string, filename: string): void {
    const doc = new EditorDocument({
      filename,
      source,
      sourceType: EditorDocumentSourceType.FileLink,
    });
    localStorage.setItem('editorFiles', JSON.stringify([doc]));
    this.router.navigate(['/editor']);
  }

  openLocalFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const source = URL.createObjectURL(file);
    this.openEditor(source, file.name);
  }

  clearFiles(): void {
    localStorage.removeItem('editorFiles');
    this.currentEditorFiles.length = 0;
  }

  private readEditorFiles(): EditorDocument[] {
    const raw = localStorage.getItem('editorFiles');
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw).map((x: any) => new EditorDocument(x));
    } catch {
      return [];
    }
  }
}
