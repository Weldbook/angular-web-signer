import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

interface SuggestedSigner {
  fullName: string;
  employeeId: number;
  positions: string[];
}
@Component({
  selector: 'app-wb-suggested-employees',
  templateUrl: './wb-suggested-employees.component.html',
  styleUrls: ['./wb-suggested-employees.component.scss']
})
export class WbSuggestedEmployeesComponent implements OnInit {

  suggestedSigners: SuggestedSigner[] = [];
  chosenEmployee?:SuggestedSigner;
  certNumber: string = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.suggestedSigners = data.suggestedSigners;
  }

  ngOnInit(): void {}

  choseEmployee(employee: SuggestedSigner){
    this.chosenEmployee = employee;
  }
}
