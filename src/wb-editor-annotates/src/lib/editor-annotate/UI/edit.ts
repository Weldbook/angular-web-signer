import {UI} from './index';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import { interval } from 'rxjs';
import {filter, takeWhile} from 'rxjs';

export class Edit extends UI {
  _enabled = false;
  isDragging = false;
  overlay: any;
  dragOffsetX: any;
  dragOffsetY: any;
  dragStartX: any;
  dragStartY: any;
  BORDER_COLOR = '#00BFFF';
  OVERLAY_BORDER_SIZE = 3;
  doc: any;
  currentTarget: any;
  carriage = false;
  caretPosition = 0;
  interval = interval(400).pipe(
    filter((a) => this.carriage === true)
  ).subscribe((el) => {
    this.defaultProperties();
  });

  clickBind = this.handleDocumentClick.bind(this);
  mouseUpBind = this.handleDocumentMouseup.bind(this);
  mouseDownBind = this.handleDocumentMousedown.bind(this);
  keyUpBind = this.handleDocumentKeyup.bind(this);
  mouseMoveBind = this.handleDocumentMousemove.bind(this);
  annotateClickBind = this.handleAnnotationClick.bind(this);
  deleteAnnotateBind = this.deleteAnnotation.bind(this);

  constructor() {
    super();
  }

   createEditOverlay(target: any) {
    this.destroyEditOverlay();
    this.overlay = this.doc.createElement('div');
    const anchor = this.doc.createElement('a');
    const parentNode = super.findSVGContainer(target).parentNode;
    const id = target.getAttribute('data-pdf-annotate-id');
    const rect = this.getAnnotationRect(target);

    const styleLeft = rect.left - this.OVERLAY_BORDER_SIZE;
    const styleTop = rect.top - this.OVERLAY_BORDER_SIZE;

    this.overlay.setAttribute('id', 'pdf-annotate-edit-overlay');
    this.overlay.setAttribute('data-target-id', id);
    this.overlay.style.boxSizing = 'content-box';
    this.overlay.style.position = 'absolute';
    this.overlay.style.top = `${styleTop}px`;
    this.overlay.style.left = `${styleLeft}px`;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.cursor = 'url("/assets/imgs/cursors/cursor_move_19px.png") 10 10, default';
    this.overlay.style.height = `${rect.height}px`;
    this.overlay.style.border = `${this.OVERLAY_BORDER_SIZE}px solid ${this.BORDER_COLOR}`;
    this.overlay.style.borderRadius = `${this.OVERLAY_BORDER_SIZE}px`;

    anchor.innerHTML = '×';
    anchor.setAttribute('href', 'javascript://');
    anchor.style.background = '#fff';
    anchor.style.borderRadius = '20px';
    anchor.style.border = '1px solid #bbb';
    anchor.style.display = 'flex';
    anchor.style.flexDirection = 'column';
    anchor.style.justifyContent = 'center';
    anchor.style.color = '#bbb';
    anchor.style.fontSize = '16px';
    anchor.style.textAlign = 'center';
    anchor.style.textDecoration = 'none';
    anchor.style.position = 'absolute';
    anchor.style.top = '-13px';
    anchor.style.right = '-13px';
    anchor.style.width = '25px';
    anchor.style.height = '25px';

    this.overlay.appendChild(anchor);
    parentNode.appendChild(this.overlay);

    this.currentTarget = target;

    this.doc.addEventListener('click', this.clickBind);
    this.doc.addEventListener('keyup', this.keyUpBind);
    this.doc.addEventListener('mousedown', this.mouseDownBind);
    anchor.addEventListener('click', this.deleteAnnotateBind);
    anchor.addEventListener('mouseover', () => {
      anchor.style.color = '#35A4DC';
      anchor.style.borderColor = '#999';
      anchor.style.boxShadow = '0 1px 1px #ccc';
    });
    anchor.addEventListener('mouseout', () => {
      anchor.style.color = '#bbb';
      anchor.style.borderColor = '#bbb';
      anchor.style.boxShadow = '';
    });
    this.overlay.addEventListener('mouseover', () => {
      if (!this.isDragging) { anchor.style.display = 'flex'; }
    });
     // this.overlay.addEventListener('mouseout', () => {
     //   anchor.style.display = 'none';
     // });

     if (target.tagName === 'text') {
       this.carriage = true;
     }
  }

   destroyEditOverlay() {
    if (this.overlay) {
      if (this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
        this.overlay = null;
      }
    }

    this.doc.removeEventListener('click', this.clickBind);
    this.doc.removeEventListener('keyup', this.keyUpBind);
    this.doc.removeEventListener('mousedown', this.mouseDownBind);
    this.doc.removeEventListener('mousemove', this.mouseMoveBind);
    this.doc.removeEventListener('mouseup', this.mouseUpBind);
    this.enableUserSelect();
  }

   deleteAnnotation() {
    if (!this.overlay) { return; }

    let annotationId = this.overlay.getAttribute('data-target-id');
     let svg = this.overlay.parentNode.querySelector('svg.wb-pdf-annotation-layer');
     let nodes = svg.querySelectorAll(`[data-pdf-annotate-id="${annotationId}"]`);

     Array.of(...nodes).forEach((n) => {
      n.parentNode.removeChild(n);
    });

    this.deleteComment(annotationId);

    this.annotationBehavior.delete.next(annotationId);


    this.destroyEditOverlay();
  }

  handleDocumentClick(e: any) {
    if (!super.findSVGAtPoint(e.clientX, e.clientY)) { return; }

    // Remove current overlay
    let overlay = this.doc.getElementById('pdf-annotate-edit-overlay');
    if (overlay) {
      if (this.isDragging || e.target === overlay) {
        return;
      }

      this.destroyEditOverlay();
    }
  }

  handleDocumentKeyup(e: any) {
    if (this.overlay && e.keyCode === 46 &&
      e.target.nodeName.toLowerCase() !== 'textarea' &&
      e.target.nodeName.toLowerCase() !== 'input') {
      this.deleteAnnotation();
    }
    if (this.currentTarget.tagName === 'text') {
      const keycode = e.keyCode;
    if (e.keyCode === 8) {
        if (this.currentTarget.textContent.includes('|')) {
          this.currentTarget.textContent =  (this.currentTarget.textContent.slice(0, this.currentTarget.textContent.length + this.caretPosition)
          ).slice(0, -2) + this.currentTarget.textContent.slice(this.caretPosition === 0 ? this.currentTarget.textContent.length : this.caretPosition);
        } else {
          this.currentTarget.textContent =  (this.currentTarget.textContent.slice(0, this.currentTarget.textContent.length + this.caretPosition)
          ).slice(0, -1) + this.currentTarget.textContent.slice(this.caretPosition === 0 ? this.currentTarget.textContent.length : this.caretPosition);
        }
      } else if ((keycode > 47 && keycode < 58)   || // number keys
      keycode === 32 || keycode === 13   || // spacebar & return key(s) (if you want to allow carriage returns)
      (keycode > 64 && keycode < 91)   || // letter keys
      (keycode > 95 && keycode < 112)  || // numpad keys
      (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
      (keycode > 218 && keycode < 223)) {
        if (this.currentTarget.textContent.includes('|')) {
          this.currentTarget.textContent = this.currentTarget.textContent.replace('|', '');
        }
      this.currentTarget.textContent = this.currentTarget.textContent.slice(0, this.currentTarget.textContent.length + this.caretPosition)
        + e.key + this.currentTarget.textContent.slice(this.caretPosition === 0 ? this.currentTarget.textContent.length : this.caretPosition);
    } else if (keycode === 37) {
      this.caretPosition -= Math.abs(this.caretPosition) <
      (this.currentTarget.textContent.includes('|') ? this.currentTarget.textContent.length - 1 : this.currentTarget.textContent.length )
        ? 1 : 0;
    } else if (keycode === 39) {
      this.caretPosition = this.caretPosition < 0 ? this.caretPosition + 1 : this.caretPosition;
    }
      super.changeTextContent(this.currentTarget.getAttribute('data-pdf-annotate-id'), this.currentTarget.textContent);
    }
  }

    handleDocumentMousedown(e: any) {
      if (e.target !== this.overlay) { return; }

    let annotationId = this.overlay.getAttribute('data-target-id');
    let target = this.doc.querySelector(`[data-pdf-annotate-id="${annotationId}"]`);
    let type = target.getAttribute('data-pdf-annotate-type');

    if (type === 'highlight' || type === 'strikeout') { return; }

    this.isDragging = true;
    this.dragOffsetX = e.clientX;
    this.dragOffsetY = e.clientY;
    this.dragStartX = this.overlay.offsetLeft;
    this.dragStartY = this.overlay.offsetTop;

    this.overlay.style.background = 'rgba(255, 255, 255, 0.7)';
    this.overlay.style.cursor = 'url("/assets/imgs/cursors/cursor_move_19px.png") 10 10, default';
    this.overlay.querySelector('a').style.display = 'none';

    this.doc.addEventListener('mousemove', this.mouseMoveBind);
    this.doc.addEventListener('mouseup', this.mouseUpBind);
    this.disableUserSelect();
  }


  handleDocumentMousemove(e: any) {
    let annotationId = this.overlay.getAttribute('data-target-id');
    let parentNode = this.overlay.parentNode;
    let rect = parentNode.getBoundingClientRect();
    let y = (this.dragStartY + (e.clientY - this.dragOffsetY));
    let x = (this.dragStartX + (e.clientX - this.dragOffsetX));
    let minY = 0;
    let maxY = rect.height;
    let minX = 0;
    let maxX = rect.width;

    if (y > minY && y + this.overlay.offsetHeight < maxY) {
      this.overlay.style.top = `${y}px`;
    }

    if (x > minX && x + this.overlay.offsetWidth < maxX) {
      this.overlay.style.left = `${x}px`;
    }
  }


  handleDocumentMouseup(e: any) {
    const annotationId = this.overlay.getAttribute('data-target-id');
    const target = this.doc.querySelectorAll(`[data-pdf-annotate-id="${annotationId}"]`);
    const type = target[0].getAttribute('data-pdf-annotate-type');
    const svg = this.overlay.parentNode.querySelector('svg.wb-pdf-annotation-layer');
    let { documentId } = this.getMetadata(svg);

    this.overlay.querySelector('a').style.display = '';

     const getDelta = (propX: any, propY: any) => {
      return calcDelta(parseInt(target[0].getAttribute(propX), 10), parseInt(target[0].getAttribute(propY), 10), {x: propX, y: propY});
    }

    const calcDelta = (x: any, y: any, axis: any) => {
       const xObj = {};
       const yObj = {};


       // @ts-ignore @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
       xObj[axis.x] = this.overlay.offsetLeft;


       // @ts-ignore @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
       yObj[axis.y] = this.overlay.offsetTop;
      return {
        deltaX: this.OVERLAY_BORDER_SIZE + (super.scaleDown(svg, xObj) as any)[axis.x] - x,
        deltaY: this.OVERLAY_BORDER_SIZE + (super.scaleDown(svg, yObj) as any)[axis.y] - y
      };
    }

    if (target) {
      if (['area', 'highlight', 'point', 'textbox', 'line'].indexOf(type) > -1) {
      let {deltaX, deltaY} = getDelta('x', 'y');
        target.forEach((t: any, i: any) => {
          if (deltaY) {
            let modelY = parseInt(t.getAttribute('y'), 10) + deltaY;
            let viewY = modelY;

            if (type === 'textbox') {
              viewY += parseInt(t.getAttribute('font-size'), 10);
            }

            if (type === 'point') {
              viewY = this.scaleUp(svg, {viewY}).viewY;
            }
              t.setAttribute('y', viewY);
          }
          if (deltaX) {
            let modelX = parseInt(t.getAttribute('x'), 10) + deltaX;
            let viewX = modelX;

            if (type === 'point') {
              viewX = this.scaleUp(svg, {viewX}).viewX;
            }
              t.setAttribute('x', viewX);
          }
          if (type === 'line') {
            const {deltaX, deltaY} = getDelta('x1', 'y1');
            const viewX1 = parseInt(t.getAttribute('x1'), 10) + deltaX;
            const viewY1 = parseInt(t.getAttribute('y1'), 10) + deltaY;
            const viewY2 = parseInt(t.getAttribute('y2'), 10) + deltaY;
            const viewX2 = parseInt(t.getAttribute('x2'), 10) + deltaX;
            let delX = Math.abs(viewX2 - viewX1);
            let delY = Math.abs(viewY2 - viewY1);
            if (viewY1 < viewY2) {
              delY *= 0;
            }
            if (viewX1 < viewX2) {
              delX *= 0;
            }
            t.setAttribute('y1', viewY1 + delY);
            t.setAttribute('x2', viewX2 + delX);
            t.setAttribute('y2', viewY2 + delY);
            t.setAttribute('x1', viewX1 + delX);
          }
        });
        }
    }

    setTimeout(() => {
      this.isDragging = false;
    }, 0);

    this.overlay.style.background = '';
    this.overlay.style.cursor = '';

    this.doc.removeEventListener('mousemove', this.mouseMoveBind);
    this.doc.removeEventListener('mouseup', this.mouseUpBind);
    this.enableUserSelect();
  }

  defaultProperties() {
    if (!this.currentTarget) return;
    if (this.currentTarget.textContent.includes('|')) {
      this.currentTarget.textContent = this.currentTarget.textContent.replace('|', '');
    } else if (this.carriage) {
      this.currentTarget.textContent = this.currentTarget.textContent.slice(0, this.currentTarget.textContent.length + this.caretPosition)
        + '|' + this.currentTarget.textContent.slice(this.caretPosition === 0 ? this.currentTarget.textContent.length : this.caretPosition);
    }
  }

  handleAnnotationClick(event: MouseEvent) {
    this.carriage = false;
    this.caretPosition = 0;
    this.defaultProperties();
    event.preventDefault();

    let target = event.target as HTMLElement;
    if (target.tagName === 'A') {
      return;
    }


    if (target.className !== 'textLayer') {


      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      if (target['parentNode']['className'] === 'textLayer') {


        // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
        target = event.target['parentNode'];
      }
    }

    const page = target.parentElement as HTMLElement;
    const svg = page.querySelector('svg');
    const svgsEl = this.findSVGElementAtPoint(svg, event.x, event.y);
    if (svgsEl) {
      this.createEditOverlay(svgsEl);
      if (svgsEl.getAttribute('data-pdf-annotate-id'))
        this.openCommentsWindow(svgsEl.getAttribute('data-pdf-annotate-id'));
    } else {


      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      if (event.target['id'] !== 'commentsWindow' && !event.target['classList'].contains('wes')) {
        this.closeCommentsWindow();
      }
    }
  }

  enableEdit () {
    if (this._enabled) { return; }

    this.doc = document.getElementsByTagName('iframe')[0].contentDocument;

    super.offSelect();

    this._enabled = true;
    this.doc.addEventListener('click', this.annotateClickBind);
  }

  disableEdit () {
    this.doc = document.getElementsByTagName('iframe')[0].contentDocument;

    if (!this._enabled) { return; }
    this.destroyEditOverlay();
    super.onSelect();
    this.carriage = false;
    this._enabled = false;
    this.doc.removeEventListener('click', this.annotateClickBind);
  }
}
