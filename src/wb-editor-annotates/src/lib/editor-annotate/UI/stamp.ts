import { UI } from './index';

let _enabled = false;
let _type: any;
let overlay: any;
let originY: any;
let originX: any;

export class Stamp extends UI {
  doc: any;
  upBind = this.handleDocumentMouseup.bind(this);
  moveBind = this.handleDocumentMousemove.bind(this);
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

      if (rects.length > 0 && rects[0].width > 0 && rects[0].height > 0) {
        return rects;
      }
    } catch (e) {}

    return null;
  }

  private createPreviewStampSVG(overlay: any, viewport?: any): SVGElement {
    let svg = this.doc.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGElement;
    svg.setAttribute('viewBox', viewport ? `0 0 ${200 * viewport.scale} ${70 * viewport.scale}` : '0 0 200 70');
    svg.setAttribute('width', viewport ? `${200 * viewport.scale}` : '200');
    svg.setAttribute('height', viewport ? `${70 * viewport.scale}` : '70');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('id', 'preview_stamp');

    let qr = this.doc.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement;
    qr.setAttribute('x', viewport ? `${8 * viewport.scale}` : '8');
    qr.setAttribute('y', viewport ? `${9 * viewport.scale}` : '9');
    qr.setAttribute('width', viewport ? `${51 * viewport.scale}` : '51');
    qr.setAttribute('height', viewport ? `${51 * viewport.scale}` : '51');
    qr.setAttribute('rx', '4');
    qr.setAttribute('fill', '#45695F');
    qr.setAttribute('fill-opacity', '0.69');

    let title = this.doc.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement;
    title.setAttribute('x', viewport ? `${73 * viewport.scale}` : '73');
    title.setAttribute('y', viewport ? `${1 * viewport.scale}` : '1');
    title.setAttribute('width', viewport ? `${126 * viewport.scale}` : '126');
    title.setAttribute('height', viewport ? `${15 * viewport.scale}` : '15');
    title.setAttribute('rx', '2');
    title.setAttribute('fill', '#45695F');
    title.setAttribute('fill-opacity', '0.69');

    let common = this.doc.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement;
    common.setAttribute('x', viewport ? `${73 * viewport.scale}` : '73');
    common.setAttribute('y', viewport ? `${30 * viewport.scale}` : '30');
    common.setAttribute('width', viewport ? `${90 * viewport.scale}` : '90');
    common.setAttribute('height', viewport ? `${9 * viewport.scale}` : '9');
    common.setAttribute('rx', '4.5');
    common.setAttribute('fill', '#45695F');
    common.setAttribute('fill-opacity', '0.69');

    let name = this.doc.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement;
    name.setAttribute('x', viewport ? `${73 * viewport.scale}` : '73');
    name.setAttribute('y', viewport ? `${48 * viewport.scale}` : '48');
    name.setAttribute('width', viewport ? `${121 * viewport.scale}` : '121');
    name.setAttribute('height', viewport ? `${4 * viewport.scale}` : '4');
    name.setAttribute('rx', '2');
    name.setAttribute('fill', '#45695F');
    name.setAttribute('fill-opacity', '0.69');

    let organization = this.doc.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement;
    organization.setAttribute('x', viewport ? `${73 * viewport.scale}` : '73');
    organization.setAttribute('y', viewport ? `${57 * viewport.scale}` : '57');
    organization.setAttribute('width', viewport ? `${121 * viewport.scale}` : '121');
    organization.setAttribute('height', viewport ? `${4 * viewport.scale}` : '4');
    organization.setAttribute('rx', '2');
    organization.setAttribute('fill', '#45695F');
    organization.setAttribute('fill-opacity', '0.69');

    svg.append(qr, title, common, name, organization);

    svg.style.position = 'absolute';
    svg.setAttribute('top', `${overlay.style.top}`);
    svg.setAttribute('left', `${overlay.style.left}`);

    if (!this.doc.getElementById('preview_stamp')) {
      overlay.appendChild(svg);
      overlay.style.zIndex = '1000';
    }

    return overlay;
  }

  private handleDocumentMousemove(e: any) {
    let svg;

    if (!overlay) {
      if (_type !== 'area' || !(svg = super.findSVGAtPoint(e.clientX, e.clientY))) {
        if (_type !== 'signature' || !(svg = super.findSVGAtPoint(e.clientX, e.clientY))) {
          if (_type !== 'stamp' || !(svg = super.findSVGAtPoint(e.clientX, e.clientY))) {
            return;
          }
        }
      }
      overlay = this.doc.createElement('div') as HTMLElement;
      overlay.style.position = 'absolute';
      overlay.style.zIndex = '1000';
      overlay.style.top = `${originY}px`;
      overlay.style.left = `${originX}px`;
      overlay.style.background = 'rgba(37, 174, 136, 0.1)';


      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      svg.parentNode.appendChild(overlay);
    }
    svg = overlay.parentNode.querySelector('svg.wb-pdf-annotation-layer');
    let rect = svg.getBoundingClientRect();

    let x = e.pageX - rect.left;
    let y = e.pageY - rect.top;

    const viewport = JSON.parse(svg.getAttribute('data-pdf-annotate-viewport'));

    overlay.style.top = `${y - 25}px`;
    overlay.style.left = `${x - 100}px`;
    overlay.style.width = `${200 * viewport.scale}px`;
    overlay.style.height = `${70 * viewport.scale}px`;

    overlay = this.createPreviewStampSVG(overlay, viewport);
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

    overlay = this.createPreviewStampSVG(overlay);

    if (_type !== 'stamp') {
      overlay.style.outline = _type === 'area' ? `3px solid black` : `1px solid rgba(37, 174, 136, 0.5)`;
      overlay.style.borderRadius = '25px';
    }

    if (_type === 'signature') overlay.style.background = 'rgba(37, 174, 136, 0.1)';

    svg.parentNode?.appendChild(overlay);
    if (_type === 'area') super.disableUserSelect();
  }

  private handleDocumentMouseup(e: MouseEvent) {
    let rects;
    if ((_type !== 'signature' || _type !== 'stamp') && (rects = this.getSelectionRects())) {
      let svg = super.findSVGAtPoint(rects[0].left, rects[0].top);
      let newRects = [];
      for (let i = 0; i < rects.length; i++) {
        newRects.push(rects[i]);
      }

      this.saveStamp(_type, newRects);
    } else if ((_type === 'signature' || _type === 'stamp') && overlay) {
      let svg = overlay.parentNode.querySelector('svg.wb-pdf-annotation-layer');
      let rect = svg.getBoundingClientRect();

      this.saveStamp(_type, [
        {
          top: parseInt(overlay.style.top, 10) + rect.top,
          left: parseInt(overlay.style.left, 10) + rect.left,
          width: parseInt(overlay.style.width, 10),
          height: parseInt(overlay.style.height, 10),
        },
      ]);

      overlay.parentNode.removeChild(overlay);
      overlay = null;

      this.doc.removeEventListener('mousemove', this.moveBind);
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

  private saveStamp(type: any, rects: any, color?: any, fill?: any) {
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

    if (type === 'signature' || type === 'stamp') {
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
      type: 'signature',
      color,
      fill,

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      page: page.hasAttribute('data-page-number')

        // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
        ? page.getAttribute('data-page-number')

        // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
        : page.parentElement.getAttribute('data-page-number'),
      rectangles: [...rects]
        .map((r) => {
          let offset = 0;

          if (type === 'strikeout') {
            offset = r.height / 2;
          }

          return super.scaleDown(svg, {
            y: r.top + offset - boundingRect.top,
            x: r.left - boundingRect.left,
            width: r.width,
            height: r.height,
          });
        })
        .filter((r: any) => r.width > 0 && r.height > 0 && r.x > -1 && r.y > -1),
    };

    if (annotation.rectangles.length === 0) {
      return;
    }

    if (type === 'signature' || type === 'stamp') {
      let rect = annotation.rectangles[0];

      // @ts-ignore @ts-expect-error TS(2790): The operand of a 'delete' operator must be optiona... Remove this comment to see the full error message
      delete annotation.rectangles;


      // @ts-ignore @ts-expect-error TS(2339): Property 'x' does not exist on type '{ type: strin... Remove this comment to see the full error message
      annotation.x = rect.x;


      // @ts-ignore @ts-expect-error TS(2339): Property 'y' does not exist on type '{ type: strin... Remove this comment to see the full error message
      annotation.y = rect.y;


      // @ts-ignore @ts-expect-error TS(2339): Property 'width' does not exist on type '{ type: s... Remove this comment to see the full error message
      annotation.width =  rect.width;


      // @ts-ignore @ts-expect-error TS(2339): Property 'height' does not exist on type '{ type: ... Remove this comment to see the full error message
      annotation.height =  rect.height;


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

  public enableStamp(type: any) {
    _type = type;

    if (_enabled) {
      return;
    }

    _enabled = true;
    this.doc = document.getElementsByTagName('iframe')[0].contentDocument;
    if (_type === 'signature' || _type === 'stamp') super.offSelect();

    this.doc.addEventListener('mousemove', this.moveBind);
    this.doc.addEventListener('mouseup', this.upBind);
    // this.doc.addEventListener('mousedown', this.downBind);
    this.doc.addEventListener('keyup', this.keyBind);
  }

  public disableStamp() {
    if (!_enabled) {
      return;
    }

    super.onSelect();

    _enabled = false;
    this.doc.removeEventListener('mousemove', this.moveBind);
    this.doc.removeEventListener('mouseup', this.upBind);
    // this.doc.removeEventListener('mousedown', this.downBind);
    this.doc.removeEventListener('keyup', this.keyBind);
  }
}
