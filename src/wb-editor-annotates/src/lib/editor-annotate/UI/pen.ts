import {UI} from './index';


// @ts-ignore @ts-expect-error TS(7016): Could not find a declaration file for module 'uuid... Remove this comment to see the full error message
import { v4 as uuid } from 'uuid';

export class Pen extends UI {
  doc: any;
  _enabled = false;
  _penSize: any;
  _penColor: any;
  path: any;
  lines: any;

  moveBind = this.handleDocumentMousemove.bind(this);
  upBind = this.handleDocumentMouseup.bind(this);
  downBind = this.handleDocumentMousedown.bind(this);
  keyBind = this.handleDocumentKeyup.bind(this);

  constructor() {
    super();
  }

  setpen(penSize: number = 1 , penColor = '000000') {
    this._penSize = penSize;
    this._penColor = penColor;
  }

   handleDocumentMousedown() {
    this.path = null;
    this.lines = [];
     this.doc.addEventListener('mousemove', this.moveBind);
     this.doc.addEventListener('mouseup', this.upBind);
  }

   handleDocumentMouseup(e: any) {
    let svg;
    this.doc.removeEventListener('mousemove', this.moveBind);
    this.doc.removeEventListener('mouseup', this.upBind);
    if (this.lines.length > 1 && (svg = super.findSVGAtPoint(e.clientX, e.clientY))) {
      let data = super.getMetadata(svg);
      const annotation = {
        type: 'drawing',
        page: data.pageNumber,
        uuid: uuid(),
        width: this._penSize,
        color: this._penColor,
        lines: this.lines
      }

        if (this.path) {
          svg.removeChild(this.path);
        }

      if (1) {
        this.annotationBehavior.add.next(annotation);
      }

        super.appendChild(svg, annotation);
    }

  }

   handleDocumentMousemove(e: MouseEvent) {
    this.savePoint(e.clientX, e.clientY);
  }


   handleDocumentKeyup(e: any) {
    // Cancel rect if Esc is pressed
    if (e.keyCode === 27) {
      this.lines = null;
      this.doc.removeEventListener('mousemove', this.moveBind);
      this.doc.removeEventListener('mouseup', this.upBind);
      this.path.parentNode.removeChild(this.path);
    }
  }


   savePoint(x: any, y: any) {
    let svg = super.findSVGAtPoint(x, y);
    if (!svg) {
      return;
    }
    let rect = svg.getBoundingClientRect();
    let point = super.scaleDown(svg, {
      x: x - rect.left,
      y: y - rect.top
    });

    this.lines.push([point['x'], point['y']]);

    if (this.lines.length <= 1) {
      return;
    }

    if (this.path) {
      svg.removeChild(this.path);
    }

    this.path = super.appendChild(svg, {
      type: 'drawing',
      color: this._penColor,
      width: this._penSize,
      lines: this.lines
    });
  }


  enablePen() {
    if (this._enabled) { return; }

    this._enabled = true;
    super.offSelect();

    this.doc = document.getElementsByTagName('iframe')[0].contentDocument;
    this.doc.addEventListener('mousedown', this.downBind);
    this.doc.addEventListener('keyup', this.keyBind);
    super.disableUserSelect();
  }


  disablePen() {
    if (!this._enabled) { return; }

    super.onSelect();

    this._enabled = false;
    this.doc.removeEventListener('mousedown', this.downBind);
    this.doc.removeEventListener('keyup', this.keyBind);
    super.enableUserSelect();
  }
}
