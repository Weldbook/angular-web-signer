import {UI} from './index';


// @ts-ignore @ts-expect-error TS(7016): Could not find a declaration file for module 'uuid... Remove this comment to see the full error message
import { v4 as uuid } from 'uuid';

export class TextE extends UI {
  doc: any;
  upBind = this.handleDocumentMouseup.bind(this);
  downBind = this.handleDocumentMousedown.bind(this);
  moveBind = this.handleDocumentMousemove.bind(this);
  blurBind = this.handleInputBlur.bind(this);
  keyBind = this.handleInputKeyup.bind(this);

  constructor() {
    super();
  }

  _enabled = false;
  input: any;
  _textSize: any;
  _textColor: any;
  _moveCheck = false;

 handleDocumentMousedown(e: any) {
   this._moveCheck = false;
   this.doc.addEventListener('mousemove', this.moveBind);
 }

 handleDocumentMousemove(e: any) {
   console.log('move');
    this._moveCheck = true;
  }

 handleDocumentMouseup(e: any) {
   this.doc.removeEventListener('mousemove', this.moveBind);
   if (this._moveCheck) {
      this._moveCheck = false;
      return;
   }
   const svg = super.findSVGAtPoint(e.clientX, e.clientY);
   if (this.input || !svg) {
    return;
  }
   const scale = super.getMetadata(svg).viewport.scale;

  this.input = this.doc.createElement('input');
  this.input.setAttribute('id', 'pdf-annotate-text-input');
  this.input.setAttribute('placeholder', 'Enter text');
  this.input.style.border = `3px solid black`;
  this.input.style.borderRadius = '3px';
  this.input.style.position = 'absolute';
  this.input.style.top = `${e.clientY}px`;
  this.input.style.left = `${e.clientX}px`;
  this.input.style.fontSize = `${this._textSize * scale}px`;

  this.input.addEventListener('blur', this.blurBind);
  this.input.addEventListener('keyup', this.keyBind);

  this.doc.body.appendChild(this.input);
  this.input.focus();
}

 handleInputBlur() {
  this.saveText();
}

 handleInputKeyup(e: any) {
  if (e.keyCode === 90 && e.ctrlKey) {
    this.closeInput();
  } else if (e.keyCode === 13) {
    this.saveText();
  }
}


 saveText() {
  if (this.input.value.trim().length > 0) {
    const clientX = parseInt(this.input.style.left, 10);
    const clientY = parseInt(this.input.style.top, 10);
    const svg = super.findSVGAtPoint(clientX, clientY);
    if (!svg) {
      return;
    }
    const page = svg.parentElement;

    const rect = svg.getBoundingClientRect();
    console.log(this._textSize);
    const annotation = Object.assign({
        type: 'textbox',

        // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
        page: page.getAttribute('data-page-number'),
        uuid: uuid(),
        size: this._textSize || 10,
        color: this._textColor || '#000000',
        content: this.input.value.trim()
      }, super.scaleDown(svg, {
        x: clientX - rect.left,
        y: clientY -  rect.top,
        width: this.input.offsetWidth,
        height: this.input.offsetHeight
      })
    );

    if (1) {
      this.annotationBehavior.add.next(annotation);
    }

        super.appendChild(svg, annotation);
  }

  this.closeInput();
}

 closeInput() {
  if (this.input) {
    this.input.removeEventListener('blur', this.blurBind);
    this.input.removeEventListener('keyup', this.keyBind);
    this.doc.body.removeChild(this.input);
    this.input = null;
  }
}

  settext(textSize: number = 12, textColor = '000000') {
  this._textSize = textSize;
  this._textColor = textColor;
}


  enableText() {
  if (this._enabled) { return; }

  this._enabled = true;
  this.doc = document.getElementsByTagName('iframe')[0].contentDocument;
  this.doc.addEventListener('mouseup', this.upBind);
  this.doc.addEventListener('mousedown', this.downBind);
}


  disableText() {
  if (!this._enabled) { return; }

  this._enabled = false;
  this.doc.removeEventListener('mouseup', this.upBind);
  this.doc.removeEventListener('mousedown', this.downBind);
  this.doc.removeEventListener('mousemove', this.moveBind);
}

}