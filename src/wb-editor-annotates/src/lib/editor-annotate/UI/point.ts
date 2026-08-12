import {UI} from './index';

export class Point extends UI {
  _enabled = false;
  input: any;
  BORDER_COLOR = '#00BFFF';
  OVERLAY_BORDER_SIZE = 3;
  doc: any;

  mouseUpBind = this.handleDocumentMouseup.bind(this);
  keyUpInputBind = this.handleInputKeyup.bind(this);
  blurInputBind = this.handleInputBlur.bind(this);

  constructor() {
    super();
  }

   handleDocumentMouseup(e: any) {
    if (this.input)this.closeInput();
    if (this.input || !this.findSVGAtPoint(e.clientX, e.clientY)) {
      return;
    }

    this.input = this.doc.createElement('input');
    this.input.setAttribute('id', 'pdf-annotate-point-this.input');
    this.input.setAttribute('placeholder', 'Enter comment');
    this.input.style.border = `3px solid ${this.BORDER_COLOR}`;
    this.input.style.borderRadius = '3px';
    this.input.style.position = 'absolute';
    this.input.style.top = `${e.clientY}px`;
    this.input.style.left = `${e.clientX}px`;

    this.input.addEventListener('blur', this.blurInputBind);
    this.input.addEventListener('keyup', this.keyUpInputBind);

    this.doc.body.appendChild(this.input);
    this.input.focus();
  }

   handleInputBlur() {
    this.savePoint();
  }

   handleInputKeyup(e: any) {
    if (e.keyCode === 27) {
      if (this.input)this.closeInput();
    } else if (e.keyCode === 13) {
      this.savePoint();
    }
  }

   savePoint() {
     if (this.input.value.trim().length > 0) {
       const clientX = parseInt(this.input.style.left, 10);
       const clientY = parseInt(this.input.style.top, 10);
       const content = this.input.value.trim();
       const svg = this.findSVGAtPoint(clientX, clientY);
       if (!svg) {
         return;
       }

       const rect = svg.getBoundingClientRect();
       const {documentId, pageNumber} = this.getMetadata(svg);
       const annotation = {
           type: 'point',
           page: pageNumber,
           uuid: this.generateUniqSvgName(),
           valueComment: this.input.value
         , ...this.scaleDown(svg, {
           x: clientX - rect.left,
           y: clientY - rect.top
         })};

       this.annotationBehavior.add.next(annotation);

       this.appendChild(svg, annotation);

       if (this.input)this.closeInput();
     }
   }

   closeInput() {
    this.input.removeEventListener('blur', this.blurInputBind);
    this.input.removeEventListener('keyup', this.keyUpInputBind);
    this.doc.body.removeChild(this.input);
    this.input = null;
  }

  enablePoint() {
    if (this._enabled) { return; }

  this._enabled = true;
    this.doc = document.getElementsByTagName('iframe')[0].contentDocument;
    this.doc.addEventListener('mouseup', this.mouseUpBind);
  }

  disablePoint() {
    if (!this._enabled) { return; }

  this._enabled = false;
    this.doc.removeEventListener('mouseup', this.mouseUpBind);
  }
}

