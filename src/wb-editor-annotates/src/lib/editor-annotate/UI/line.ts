import {UI} from './index';

let _enabled = false;
let _type;
let overlay: any;
let originY;
let originY2;
let originX;
let originX2;
let viewport

export class Line extends UI {
  doc: any;
  lineWidth = 1;
  lineColor = 'FF00000';
  upBind = this.handleDocumentMouseup.bind(this);
  downBind = this.handleDocumentMousedown.bind(this);
  keyBind = this.handleDocumentKeyup.bind(this);
  moveBind = this.handleDocumentMousemove.bind(this);
  constructor() {
    super();
  }

  private getSelectionRects() {
    try {

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      let selection = document.getElementsByTagName('iframe')[0].contentWindow.getSelection();

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      let range = selection.getRangeAt(0);
      let rects = range.getClientRects();

      if (rects.length > 0 &&
        rects[0].width > 0 &&
        rects[0].height > 0) {
        return rects;
      }
    } catch (e) {}

    return null;
  }

  private handleDocumentMousemove(e: any) {

    let svg = overlay.parentNode;
    let rect = svg.getBoundingClientRect();
    // console.log(rect);
    let point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    point = super.scaleDown(svg, point);
    originX2 = point['x'];
    originY2 = point['y'];

    overlay.setAttribute('x2',  originX2);
    overlay.setAttribute('y2', originY2);
  }

  private handleDocumentMousedown(e: MouseEvent) {
    let svg;
    if (!(svg = super.findSVGAtPoint(e.clientX, e.clientY))) {
      return;
    }
    const meta = this.getMetadata(svg);
    viewport = meta.viewport;
    originY = e.clientY;
    originX = e.clientX;
    let rect = svg.getBoundingClientRect();
    let point = {
      x: originX - rect.left,
      y: originY - rect.top
    };
    point = super.scaleDown(svg, point);


    originX = point['x'] ;
    originY = point['y'] ;

    // console.log(e.clientX, e.offsetX);
    // console.log(e.clientY, e.offsetY);

    const doc = document.getElementsByTagName('iframe')[0].contentDocument;

    // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
    overlay = doc.createElementNS('http://www.w3.org/2000/svg', 'line');
    overlay.setAttribute('x1', originX);
    overlay.setAttribute('y1', originY);
    overlay.setAttribute('x2', originX);
    overlay.setAttribute('y2', originY);
    overlay.setAttribute('stroke', this.lineColor);
    overlay.setAttribute('stroke-width', this.lineWidth);
    overlay.style['stroke-width'] = this.lineWidth;
    svg.append(this.transform(overlay, viewport));

    this.doc.addEventListener('mousemove', this.moveBind);
    super.disableUserSelect();
  }
  //

  private handleDocumentMouseup(e: MouseEvent) {
    let svg;
    if (!(svg = super.findSVGAtPoint(e.clientX, e.clientY))) {
      return;
    }
    const meta = super.getMetadata(svg);

    this.doc.removeEventListener('mousemove', this.moveBind);
    const uuid = super.generateUniqSvgName();
    overlay.setAttribute('data-pdf-annotate-id', uuid);
    overlay.setAttribute('data-pdf-annotate-type', 'line');

    const annotation = {
      type: 'line',
      page: meta.pageNumber,
      uuid: uuid,
      start: [overlay.getAttribute('x1'), overlay.getAttribute('y1')],
      end: [overlay.getAttribute('x2'), overlay.getAttribute('y2')],
      color: this.lineColor,
      width: this.lineWidth
    };

    if (1) {
      this.annotationBehavior.add.next(annotation);
    }
      super.enableUserSelect();
  }

  private handleDocumentKeyup(e: any) {
    console.log('keyup')
    // Cancel rect if Esc is pressed
    if (e.keyCode === 90 && e.ctrlKey) {
      let selection = window.getSelection();

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      selection.removeAllRanges();
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
        overlay = null;
        document.removeEventListener('mousemove', this.moveBind);
      }
    }
  }
  //
  private saveRect(type: any, rects: any, color?: any) {
    let svg = super.findSVGAtPoint(rects[0].left, rects[0].top);

    // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
    let page = svg.parentElement;
    let node;
    let annotation;

    if (!svg) {
      return;
    }

    let boundingRect = svg.getBoundingClientRect();

    if (!color) {
      if (type === 'highlight') {
        color = 'FFFF00';
      } else if (type === 'strikeout') {
        color = 'FF0000';
      }
    }

    annotation = {
      type,
      color,

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      page: page.getAttribute('data-page-number'),
      rectangles: [...rects].map((r) => {
        let offset = 0;

        if (type === 'strikeout') {
          offset = r.height / 2;
        }

        return super.scaleDown(svg, {
          y: (r.top + offset) - boundingRect.top,
          x: r.left - boundingRect.left,
          width: r.width,
          height: r.height
        });
      }).filter((r: any) => r.width > 0 && r.height > 0 && r.x > -1 && r.y > -1)
    };

    // Short circuit if no rectangles exist
    if (annotation.rectangles.length === 0) {
      return;
    }

    // Special treatment for area as it only supports a single rect
    if (type === 'area') {
      let rect = annotation.rectangles[0];

      // @ts-ignore @ts-expect-error TS(2790): The operand of a 'delete' operator must be optiona... Remove this comment to see the full error message
      delete annotation.rectangles;


      // @ts-ignore @ts-expect-error TS(2339): Property 'x' does not exist on type '{ type: any; ... Remove this comment to see the full error message
      annotation.x = rect.x;


      // @ts-ignore @ts-expect-error TS(2339): Property 'y' does not exist on type '{ type: any; ... Remove this comment to see the full error message
      annotation.y = rect.y;


      // @ts-ignore @ts-expect-error TS(2339): Property 'width' does not exist on type '{ type: a... Remove this comment to see the full error message
      annotation.width = rect.width;


      // @ts-ignore @ts-expect-error TS(2339): Property 'height' does not exist on type '{ type: ... Remove this comment to see the full error message
      annotation.height = rect.height;
    }

    console.log('annotation', annotation);
    super.appendChild(svg, annotation);
  }

  public enableLine() {

    if (_enabled) { return; }

    _enabled = true;
    this.doc = document.getElementsByTagName('iframe')[0].contentDocument;
      super.offSelect();

    this.doc.addEventListener('mouseup', this.upBind);
    this.doc.addEventListener('mousedown', this.downBind);
    this.doc.addEventListener('keyup', this.keyBind);
  }

  setline(lineSize: number = 1, lineColor = 'FF0000') {
    this.lineWidth = lineSize;
    this.lineColor = lineColor;
  }

  public disableLine() {
    if (!_enabled) { return; }

    super.onSelect();

    _enabled = false;
    this.doc.removeEventListener('mouseup', this.upBind);
    this.doc.removeEventListener('mousedown', this.downBind);
    this.doc.removeEventListener('keyup', this.keyBind);
  }
};
