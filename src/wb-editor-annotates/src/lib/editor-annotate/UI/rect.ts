import {UI} from './index';

let _enabled = false;
let _type: any;
let overlay: any;
let originY: any;
let originX: any;

export class Rect extends UI {
  doc: any;
  upBind = this.handleDocumentMouseup.bind(this);
  downBind = this.handleDocumentMousedown.bind(this);
  keyBind = this.handleDocumentKeyup.bind(this);
  areaWidth = 1;
  areaColor = 'FF0000';

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

    let svg = overlay.parentNode.querySelector('svg.wb-pdf-annotation-layer');
    let rect = svg.getBoundingClientRect();

    const xMin = Math.min(originX, (e.clientX));
    const xMax = Math.max(originX, (e.clientX));
    const yMin = Math.min(originY, (e.clientY));
    const yMax = Math.max(originY, (e.clientY));
    // if (originX + (e.clientX - originX) < rect.right) {
    //   overlay.style.width = `${e.clientX - originX}px`;
    // }
    //
    // if (originY + (e.clientY - originY) < rect.bottom) {
    //   overlay.style.height = `${e.clientY - originY}px`;
    // }


    overlay.style.top = `${yMin - rect.top}px`;
    overlay.style.left = `${xMin - rect.left}px`;
    overlay.style.width = `${xMax - xMin}px`;
    overlay.style.height = `${yMax - yMin}px`;
  }

  private handleDocumentMousedown(e: MouseEvent) {
    let svg;
    if (_type !== 'area' || !(svg = super.findSVGAtPoint(e.clientX, e.clientY))) {
      if (_type !== 'signature' || !(svg = super.findSVGAtPoint(e.clientX, e.clientY))) {
        if (_type !== 'stamp' || !(svg = super.findSVGAtPoint(e.clientX, e.clientY))) {
          return;
        }
      }
    }
    let rect = svg.getBoundingClientRect();
    originY = e.clientY;
    originX = e.clientX;

    overlay = this.doc.createElement('div') as HTMLElement;
    overlay.style.position = 'absolute';
    overlay.style.top = `${originY - rect.top}px`;
    overlay.style.left = `${originX - rect.left}px`;

    if (_type !== 'stamp') {
      overlay.style.outline = (_type === 'area') ? `3px solid black` : `1px solid rgba(37, 174, 136, 0.5)`;
      overlay.style.borderRadius = '25px';
    }

    if (_type === 'signature') overlay.style.background = 'rgba(37, 174, 136, 0.1)';


    // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
    svg.parentNode.appendChild(overlay);
    this.doc.addEventListener('mousemove', this.handleDocumentMousemove);
    if (_type === 'area') super.disableUserSelect();
  }

  private handleDocumentMouseup(e: MouseEvent) {
    let rects;
    if ((_type !== 'area' || _type !== 'signature' || _type !== 'stamp')
        && (rects = this.getSelectionRects())) {
      let svg = super.findSVGAtPoint(rects[0].left, rects[0].top);
      let newRects:any[] = [];
      for (let i = 0; i < rects.length; i++ ) {
        newRects.push(rects[i]);
      }

      this.saveRect(_type, newRects);
    } else if ((_type === 'area' || _type === 'signature' || _type === 'stamp') && overlay) {
      let svg = overlay.parentNode.querySelector('svg.wb-pdf-annotation-layer');
      let rect = svg.getBoundingClientRect();
      this.saveRect(_type, [
        {
          top: parseInt(overlay.style.top, 10) + rect.top,
          left: parseInt(overlay.style.left, 10) + rect.left,
          width: parseInt(overlay.style.width, 10),
          height: parseInt(overlay.style.height, 10),
        },
      ]);

      overlay.parentNode.removeChild(overlay);
      overlay = null;

      this.doc.removeEventListener('mousemove', this.handleDocumentMousemove);
      super.enableUserSelect();
    }
  }

  setarea(rectSize: number = 1, rectColor = 'FF0000') {
    this.areaWidth = rectSize;
    this.areaColor = rectColor;
  }

  private handleDocumentKeyup(e: any) {
    // Cancel rect if Esc is pressed
    if (e.keyCode === 27) {
      let selection = window.getSelection();

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      selection.removeAllRanges();
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
        overlay = null;
        document.removeEventListener('mousemove', this.handleDocumentMousemove);
      }
    }
  }

  private saveRect(type: any, rects: any, color?: any, fill?: any) {
      let svg = super.findSVGAtPoint(rects[0].left, rects[0].top);

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      let page = type === 'area' ? svg.parentElement : svg;
      let node;
      let annotation;

      if (!svg) {
        return;
      }

      let boundingRect = svg.getBoundingClientRect();

      if (type === 'area') {
        color = this.areaColor;
      }

      if (type === 'signature') {
        color = '25ae88';
        fill = 'rgba(37, 174, 136, 0.1)';
      }

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
        fill,

        // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
        page: page.hasAttribute('data-page-number')

          // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
          ? page.getAttribute('data-page-number')

          // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
          : page.parentElement.getAttribute('data-page-number'),
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

      if (annotation.rectangles.length === 0) {
        return;
      }

      if (type === 'area' || type === 'signature' || type === 'stamp') {
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


        // @ts-ignore @ts-expect-error TS(2339): Property 'background' does not exist on type '{ ty... Remove this comment to see the full error message
        annotation.background = fill;


        // @ts-ignore @ts-expect-error TS(2339): Property 'docFootprint' does not exist on type '{ ... Remove this comment to see the full error message
        annotation.docFootprint = document.getElementsByTagName('iframe')[0].contentWindow['PDFViewerApplication'].documentFingerprint;
      }


      if (1) {
        this.annotationBehavior.add.next(annotation);
      }

      super.appendChild(svg, annotation);
    }

    public enableRect(type: any) {
      _type = type;

      if (_enabled) { return; }

      _enabled = true;
      this.doc = document.getElementsByTagName('iframe')[0].contentDocument;
      if (_type === 'area' || _type === 'signature' || _type === 'stamp')
        super.offSelect();

      this.doc.addEventListener('mousedown', this.downBind);
      this.doc.addEventListener('mouseup', this.upBind);
      this.doc.addEventListener('keyup', this.keyBind);
    }

    public disableRect() {
      if (!_enabled) { return; }

      super.onSelect();

      _enabled = false;
      this.doc.removeEventListener('mousedown', this.downBind);
      this.doc.removeEventListener('mouseup', this.upBind);
      this.doc.removeEventListener('keyup', this.keyBind);
    }
}


