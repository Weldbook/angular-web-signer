import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SIGNER_SETTINGS_DEFAULTS, SignatureType, SignerSettings } from '../../signer/signer-settings';
import { SignerSettingsService } from '../../signer/signer-settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  readonly signatureTypes: SignatureType[] = ['CADES_BES', 'CADES_T'];

  form: SignerSettings;

  constructor(
    public dialogRef: MatDialogRef<SettingsComponent>,
    private settingsService: SignerSettingsService
  ) {
    this.form = { ...this.settingsService.getSettings() };
  }

  ngOnInit(): void {
  }

  save(): void {
    this.settingsService.saveSettings({ ...this.form });
    this.dialogRef.close(this.form);
  }

  close(): void {
    this.dialogRef.close();
  }

  resetDefaults(): void {
    this.form = { ...SIGNER_SETTINGS_DEFAULTS };
  }
}
