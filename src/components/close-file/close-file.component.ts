import { Component } from '@angular/core';
import { MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: 'app-close-file',
  templateUrl: './close-file.component.html',
  styleUrls: ['./close-file.component.scss']
})
export class CloseFileComponent {

  constructor(
    private dialogRef: MatDialogRef<CloseFileComponent>,
  ) { }

  close(accept: boolean) {
    this.dialogRef.close(accept);
  }
}
