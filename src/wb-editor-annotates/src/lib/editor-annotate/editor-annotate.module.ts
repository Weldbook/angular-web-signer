import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {UI} from './UI';
import {Rect} from './UI/rect';
import {Pen} from './UI/pen';
import {EditorAnnotates} from './editorAnnotates';
import {Point} from './UI/point';
import {Edit} from './UI/edit';
import {TextE} from './UI/text';
import {Line} from './UI/line';
import {Render} from './renderSvg/render';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  exports: [],
  providers: [
    Pen,
    UI,
    Point,
    Rect,
    Edit,
    TextE,
    Line,
    Render,
    EditorAnnotates
  ]
})
export class EditorAnnotateModule { }
