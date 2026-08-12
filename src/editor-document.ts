export type FileLink = string;

export enum EditorDocumentSourceType { 'FileLink', 'ArrayBuffer', 'Uint16Array', 'Blob' };

export class EditorDocument {
    source:  FileLink | ArrayBuffer | Uint16Array | Blob | null = null;
    sourceType: EditorDocumentSourceType | null = null;
    filename: string | null = null;
    content?: ArrayBuffer | null = null;
    signedContent?: ArrayBuffer | null = null;
    saveData?: any = null;
    documentInfo?: any = null;
    verified?: boolean = false;
    signInProgress?: boolean = false;
    annotations?: any[] = [];
    signatures?: any[] = [];
    detachedSignatures?: any[] = [];

  constructor(cfg: any){
        Object.keys(this).forEach((prop: string) => {
          if (cfg[prop] !== undefined) {
            switch (prop) {
              case 'signedContent': this.signedContent = cfg[prop] ? Uint8Array.from(atob(cfg[prop]), c => c.charCodeAt(0)).buffer: null; break;
              default:
              (this as any)[prop] = cfg[prop]
            }
          };
        });
    }
}
