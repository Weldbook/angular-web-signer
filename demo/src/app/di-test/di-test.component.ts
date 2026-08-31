import { Component, inject, InjectionToken, Injector, Type } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import {
  EditorSignerService,
  SignerSettings,
  SignerSettingsService,
  VisibleSignaturePlacer,
  WBD_ANNOTATIONS_OBJECT,
  WBD_COMMENTS,
  WBD_DOWNLOAD,
  WBD_EDITOR_ANNOTATES,
  WBD_SNACKBAR_SERVICE,
  WBD_VISIBLE_SIGNATURE_PLACER,
} from '@wbd/editor';

interface TestResult {
  key: string;
  label: string;
  target: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

interface TestDefinition {
  key: string;
  label: string;
  target: string;
  run: () => string | Promise<string>;
}

@Component({
  selector: 'app-di-test',
  templateUrl: './di-test.component.html',
  styleUrls: ['./di-test.component.scss'],
})
export class DiTestComponent {
  private injector = inject(Injector);

  results: TestResult[] = [];
  running = false;

  readonly settingsService = inject(SignerSettingsService);
  readonly visibleSignaturePlacer: VisibleSignaturePlacer = inject(WBD_VISIBLE_SIGNATURE_PLACER);

  settings: SignerSettings;
  settingsDirty = false;

  readonly signatureTypes = ['CADES_BES', 'CADES_T'];

  readonly tests: TestDefinition[] = [
    {
      key: 'signer-settings',
      label: 'SignerSettingsService',
      target: 'injected SignerSettingsService + localStorage',
      run: () => {
        const saved: SignerSettings = {
          signatureType: 'CADES_BES',
          tspUrl: 'https://tsp.test/tsp.srf',
          ocspUrl: 'https://ocsp.test/ocsp.srf',
        };
        this.settingsService.saveSettings(saved);
        const reloaded = new SignerSettingsService();
        const actual = reloaded.getSettings();
        if (
          actual.signatureType !== 'CADES_BES'
          || actual.tspUrl !== 'https://tsp.test/tsp.srf'
          || actual.ocspUrl !== 'https://ocsp.test/ocsp.srf'
        ) {
          throw new Error('Values do not round-trip through localStorage: ' + JSON.stringify(actual));
        }
        return 'Settings saved, reloaded from localStorage and verified';
      },
    },
    {
      key: 'visible-placer-type',
      label: 'VisibleSignaturePlacer token',
      target: 'WBD_VISIBLE_SIGNATURE_PLACER',
      run: () => {
        const impl = this.visibleSignaturePlacer;
        if (!impl || typeof impl.placeVisibleSignature !== 'function') {
          throw new Error('Resolved value does not implement placeVisibleSignature()');
        }
        const label = this.implLabel(impl);
        if (label === '—') {
          throw new Error('Token resolved to an unknown value — check the WBD_VISIBLE_SIGNATURE_PLACER provider');
        }
        return 'Token resolves to: ' + label;
      },
    },
    {
      key: 'visible-placer-smoke',
      label: 'PdfVisibleSignaturePlacer',
      target: 'placeVisibleSignature() against a real PDF',
      run: async () => {
        const doc = await PDFDocument.create();
        const page = doc.addPage([420, 300]);
        const helvetica = await doc.embedFont('Helvetica');
        page.drawText('DI test document', { x: 40, y: 250, size: 18, font: helvetica });
        const buffer = await doc.save();
        const fakeCertificate = {
          certificateNumber: 'AAAABBBBCCCC',
          subjectData: { CN: 'DI Test User' },
          validFrom: '01.01.2026',
          validTo: '01.01.2030',
        } as any;
        const currentSign = { fieldName: 'Signature1', rect: [40, 40, 380, 160], page: 1 };
        const output = await this.visibleSignaturePlacer.placeVisibleSignature(buffer, currentSign, fakeCertificate);
        if (!output || output.byteLength < 100) {
          throw new Error('Placer returned an empty document');
        }
        return 'Stamped a generated PDF: ' + buffer.byteLength + ' -> ' + output.byteLength + ' bytes ('
          + this.implLabel(this.visibleSignaturePlacer) + ')';
      },
    },
    {
      key: 'editor-annotates',
      label: 'EditorAnnotates engine',
      target: 'WBD_EDITOR_ANNOTATES',
      run: () => {
        const engine: any = this.injector.get(WBD_EDITOR_ANNOTATES);
        if (!engine) {
          throw new Error('WBD_EDITOR_ANNOTATES is not provided');
        }
        const tools = ['pen', 'text', 'line', 'rect', 'signature', 'stamp'].filter((t) => engine[t]);
        if (tools.length < 4) {
          throw new Error('Engine is missing annotation tools (found: ' + tools.join(', ') + ')');
        }
        return 'Tools available: ' + tools.join(', ');
      },
    },
    {
      key: 'signer-service',
      label: 'EditorSignerService',
      target: 'service + injected dependencies',
      run: () => {
        const svc = this.injector.get(EditorSignerService);
        if (typeof svc?.createSign !== 'function' || typeof svc?.getCertificates !== 'function') {
          throw new Error('Injected EditorSignerService has no expected methods');
        }
        if (typeof svc.visibleSignaturePlacer?.placeVisibleSignature !== 'function') {
          throw new Error('EditorSignerService.internal placer is not wired');
        }
        if (typeof svc.signerSettingsService?.getSettings !== 'function') {
          throw new Error('EditorSignerService.internal settings service is not wired');
        }
        return 'Injected with visibleSignaturePlacer + signerSettingsService wired'
          + (this.hasCadesPlugin() ? ', cadesplugin detected' : ' (cadesplugin extension not installed, signing skipped)');
      },
    },
    {
      key: 'snackbar',
      label: 'Snackbar service',
      target: 'WBD_SNACKBAR_SERVICE',
      run: () => {
        const snackbar: any = this.injector.get(WBD_SNACKBAR_SERVICE, null);
        if (!snackbar || typeof snackbar.open !== 'function') {
          throw new Error('Snackbar service does not implement open()');
        }
        snackbar.open('DI test: snackbar service works', 'OK');
        return 'open() invoked on ' + this.implLabel(snackbar);
      },
    },
    {
      key: 'download',
      label: 'Download helper',
      target: 'WBD_DOWNLOAD',
      run: () => {
        const download: any = this.injector.get(WBD_DOWNLOAD, null);
        if (typeof download !== 'function') {
          throw new Error('WBD_DOWNLOAD must be provided as a function');
        }
        download(new Blob(['di-test'], { type: 'text/plain' }), 'di-test.txt');
        return 'Download function invoked with a test blob (' + this.implLabel(download) + ')';
      },
    },
    {
      key: 'registry-objects',
      label: 'Annotation / comment registries',
      target: 'WBD_ANNOTATIONS_OBJECT, WBD_COMMENTS',
      run: () => {
        const annotations = this.injector.get(WBD_ANNOTATIONS_OBJECT, null);
        const comments = this.injector.get(WBD_COMMENTS, null);
        if (typeof annotations !== 'object' || annotations === null) {
          throw new Error('WBD_ANNOTATIONS_OBJECT must resolve to an object');
        }
        if (typeof comments !== 'object' || comments === null) {
          throw new Error('WBD_COMMENTS must resolve to an object');
        }
        return 'Both registry objects resolve';
      },
    },
  ];

  ngOnInit(): void {
    this.settings = { ...this.settingsService.getSettings() };
  }

  get settingsSummary(): string {
    return [
      'type=' + this.settings.signatureType,
      'tsp=' + (this.settings.tspUrl || '(empty)'),
      'ocsp=' + (this.settings.ocspUrl || '(empty)'),
    ].join(',  ');
  }

  onTypeChange(): void {
    this.settingsDirty = true;
  }

  onUrlChange(): void {
    this.settingsDirty = true;
  }

  saveSettings(): void {
    this.settingsService.saveSettings({ ...this.settings });
    this.settingsDirty = false;
  }

  resetSettings(): void {
    this.settingsService.resetDefaults();
    this.settings = { ...this.settingsService.getSettings() };
    this.settingsDirty = false;
  }

  clearResults(): void {
    this.results = [];
  }

  async runAll(): Promise<void> {
    this.running = true;
    this.results = [];
    for (const test of this.tests) {
      this.results.push(await this.execute(test));
    }
    this.running = false;
  }

  async runSingle(test: TestDefinition): Promise<void> {
    this.results = this.results.filter((r) => r.key !== test.key);
    this.results.push(await this.execute(test));
  }

  get passedCount(): number {
    return this.results.filter((r) => r.passed).length;
  }

  get failedCount(): number {
    return this.results.filter((r) => !r.passed).length;
  }

  private async execute(test: TestDefinition): Promise<TestResult> {
    const started = performance.now();
    let passed = true;
    let message = '';
    try {
      message = (await test.run()) || 'OK';
    } catch (e: any) {
      passed = false;
      message = e?.message || String(e);
    }
    return {
      key: test.key,
      label: test.label,
      target: test.target,
      passed,
      message,
      durationMs: Math.round(performance.now() - started),
    };
  }

  private implLabel(value: any): string {
    try {
      if (!value) {
        return '—';
      }
      if (typeof value === 'function') {
        return 'function';
      }
      return value.constructor?.name || typeof value;
    } catch {
      return '—';
    }
  }

  private hasCadesPlugin(): boolean {
    return !!(window as any)['cadesplugin'];
  }
}
