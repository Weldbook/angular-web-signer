import { Injectable } from '@angular/core';
import { SIGNER_SETTINGS_DEFAULTS, SignerSettings } from './signer-settings';

const STORAGE_KEY = 'wbd-editor-signer-settings';

/**
 * Persists user signing settings (signature type, TSP and OCSP server URLs)
 * in `localStorage`.
 */
@Injectable()
export class SignerSettingsService {
  private settings: SignerSettings;

  constructor() {
    this.settings = this.load();
  }

  getSettings(): SignerSettings {
    return this.settings;
  }

  saveSettings(settings: SignerSettings): void {
    this.settings = {
      signatureType: settings.signatureType,
      tspUrl: (settings.tspUrl || '').trim(),
      ocspUrl: (settings.ocspUrl || '').trim(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save signer settings', e);
    }
  }

  resetDefaults(): void {
    this.saveSettings({ ...SIGNER_SETTINGS_DEFAULTS });
  }

  private load(): SignerSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { ...SIGNER_SETTINGS_DEFAULTS };
      }
      const parsed = JSON.parse(raw);
      return {
        signatureType: parsed.signatureType === 'CADES_BES' ? 'CADES_BES' : 'CADES_T',
        tspUrl: typeof parsed.tspUrl === 'string' ? parsed.tspUrl : SIGNER_SETTINGS_DEFAULTS.tspUrl,
        ocspUrl: typeof parsed.ocspUrl === 'string' ? parsed.ocspUrl : SIGNER_SETTINGS_DEFAULTS.ocspUrl,
      };
    } catch (e) {
      return { ...SIGNER_SETTINGS_DEFAULTS };
    }
  }
}
