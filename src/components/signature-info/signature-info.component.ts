import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-signature-info',
  templateUrl: './signature-info.component.html',
  styleUrls: ['./signature-info.component.scss']
})
export class SignatureInfoComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<SignatureInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public signatureData: any) {
    this.signatureData.sigInfo.time = this.formatDate(this.signatureData.sigInfo.time);
    this.signatureData.certInfo.validFromDate = this.formatDate(this.signatureData.certInfo.validFromDate);
    this.signatureData.certInfo.validToDate = this.formatDate(this.signatureData.certInfo.validToDate);
  }

  ngOnInit(): void {
  }

  formatDate(string: string){
    return (new Date(Date.parse(string))).toLocaleString().replace(', ',' | ')
  }

  close() {
    this.dialogRef.close();
  }
}
