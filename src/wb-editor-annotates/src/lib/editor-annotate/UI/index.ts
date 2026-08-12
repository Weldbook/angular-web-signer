import {Render} from '../renderSvg/render';


// @ts-ignore @ts-expect-error TS(7016): Could not find a declaration file for module 'uuid... Remove this comment to see the full error message
import { v4 as uuid } from 'uuid';
import {BehaviorSubject} from "rxjs";
import {comments} from '../comments/comments';
import {annotationsObject} from '../annotations/annotations';
import moment from 'moment';

export class UI {
  user = UI.readUser();

  private static readUser(): string {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) {
        return 'user';
      }
      return (JSON.parse(raw) as { login?: string }).login || 'user';
    } catch {
      return 'user';
    }
  }

  comments = comments;
  annotationsObject = annotationsObject;
  commentsWindow: any;
  keyupBind = this.handleKeyUp.bind(this);

  annotationBehavior = {
    add: new BehaviorSubject<any>(null),
    delete: new BehaviorSubject<any>(null),
    change: new BehaviorSubject<any>(null)
  };

  isFirefox = /firefox/i.test(navigator.userAgent);
  public render = new Render();

  constructor( ) {
    this.annotationBehavior.add.subscribe((annotation) => {
      if (!annotation)return;
      this.addAnnotationObj(annotation);
    })
    this.annotationBehavior.delete.subscribe((annotationId: string) => {
      this.deleteAnnotationObj(annotationId);
    })
    this.annotationBehavior.change.subscribe((annotation) => {
      this.changeAnnotationObj(annotation);
    });
  }

  deleteAnnotationsListeners() {
    this.annotationBehavior.add.unsubscribe();
    this.annotationBehavior.delete.unsubscribe();
    this.annotationBehavior.change.unsubscribe();
  }

  addAnnotationObj(annotation: any) {
    if (annotation.type === 'point') {
      delete annotation.valueComment;
    }
    this.changeFlagActivate();
    this.annotationsObject.annotations.push(annotation);
  }

  deleteAnnotationObj(annotationId: any) {
    if (!annotationId)return;
    const annotationIndex = this.annotationsObject.annotations.findIndex(ann => ann['uuid'] === annotationId);
    if (annotationIndex >= 0) {
      this.changeFlagActivate();
      this.annotationsObject.annotations.splice(annotationIndex, 1);
    }
  }

  changeAnnotationObj(annotation: any) {
    const annotationIndex = this.annotationsObject.annotations.findIndex(ann => ann['uuid'] === annotation.uuid);
    if (annotationIndex >= 0) {
      this.changeFlagActivate();
      this.annotationsObject.annotations[annotationIndex] = annotation
    }
  }

  changeFlagActivate() {
    if (this.annotationsObject && !this.annotationsObject.change)
      this.annotationsObject.change = true;
  }

  initGlobalListeners() {
    document.addEventListener('keyup', this.keyupBind);
  }

  handleKeyUp(e: any) {
    if (e.keyCode === 27) {
    }
  }

  pointIntersectsRect(x: any, y: any, rect: any) {
    return y >= rect.top && y <= rect.bottom && x >= rect.left && x <= rect.right;
  }

  findSVGContainer(node: any) {
    let parentNode = node;
    while ((parentNode = parentNode.parentNode) &&
    parentNode !== document.getElementsByTagName('iframe')[0].contentDocument) {
      if (parentNode.nodeName === 'svg' &&
        parentNode.getAttribute('data-pdf-annotate-container') === 'true') {
        return parentNode;
      }
    }
    let secondeChance = false;
    if (parentNode.childNodes.forEach((el: any) => {
      if (parentNode.childNodes[el].nodeName === 'svg') {
        secondeChance = parentNode.childNodes[el];
      }
    })) {

    }
    if (secondeChance) return secondeChance;
    return null;
  }

  findSVGElementAtPoint(svg: any, x: any, y: any) {
    if (!svg) return;
    const elements = svg.children;
    for (let i = elements.length - 1; i > -1; i--) {
      const el = elements[i];
      const rect = el.getBoundingClientRect();

      if (y >= rect.top && y <= rect.bottom && x >= rect.left && x <= rect.right) {

        return el;
      }
    }

    return null;
  }

  findSVGAtPoint(x: any, y: any) {
    const doc = document.getElementsByTagName('iframe')[0].contentDocument;

    // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
    const elements = doc.querySelectorAll('svg.wb-pdf-annotation-layer');
    for (let i = 0, l = elements.length; i < l; i++) {
      const el = elements[i];
      const rect = el.getBoundingClientRect();

      if (y >= rect.top && y <= rect.bottom && x >= rect.left && x <= rect.right) {

        return el;
      }
    }

    return null;
  }

  getMetadata(svg: any) {
    return {
      documentId: svg.getAttribute('data-pdf-annotate-document'),
      pageNumber: parseInt(svg.getAttribute('data-pdf-annotate-page'), 10),
      viewport: JSON.parse(svg.getAttribute('data-pdf-annotate-viewport'))
    };
  }

  scaleDown(svg: any, rect: any) {
    const result = {...rect};
    const viewport = this.getMetadata(svg).viewport;

    Object.keys(rect).forEach((key) => {
      result[key] /= viewport.scale;
    });

    return result;
  }

  getTranslation(viewport: any) {
    let x;
    let y;
    switch (viewport.rotation % 360) {
      case 0:
        x = y = 0;
        break;
      case 90:
        x = 0;
        y = (viewport.width / viewport.scale) * -1;
        break;
      case 180:
        x = (viewport.width / viewport.scale) * -1;
        y = (viewport.height / viewport.scale) * -1;
        break;
      case 270:
        x = (viewport.height / viewport.scale) * -1;
        y = 0;
        break;
    }

    return {x, y};
  }

  transform(node: any, viewport: any) {
    let trans = this.getTranslation(viewport);

    // Let SVG natively transform the element
    node.setAttribute('transform', `scale(${viewport.scale}) rotate(${viewport.rotation}) translate(${trans.x}, ${trans.y})`);

    // Manually adjust x/y for nested SVG nodes
    if (!this.isFirefox && node.nodeName.toLowerCase() === 'svg') {
      node.setAttribute('x', parseInt(node.getAttribute('x'), 10) * viewport.scale);
      node.setAttribute('y', parseInt(node.getAttribute('y'), 10) * viewport.scale);

      let x = parseInt(node.getAttribute('x', 10));
      let y = parseInt(node.getAttribute('y', 10));
      let width = parseInt(node.getAttribute('width'), 10);
      let height = parseInt(node.getAttribute('height'), 10);
      let path = node.querySelector('path');
      let svg = path.parentNode;

      // Scale width/height
      [node, svg, path, node.querySelector('rect')].forEach((n) => {
        n.setAttribute('width', parseInt(n.getAttribute('width'), 10) * viewport.scale);
        n.setAttribute('height', parseInt(n.getAttribute('height'), 10) * viewport.scale);
      });

      this.transform(path, {...viewport, scale: 1});

      switch (viewport.rotation % 360) {
        case 90:
          node.setAttribute('x', viewport.width - y - width);
          node.setAttribute('y', x);
          svg.setAttribute('x', 1);
          svg.setAttribute('y', 0);
          break;
        case 180:
          node.setAttribute('x', viewport.width - x - width);
          node.setAttribute('y', viewport.height - y - height);
          svg.setAttribute('y', 2);
          break;
        case 270:
          node.setAttribute('x', y);
          node.setAttribute('y', viewport.height - x - height);
          svg.setAttribute('x', -1);
          svg.setAttribute('y', 0);
          break;
      }
    }

    return node;
  }

  transformSignature(node: any, viewport: any) {
    if (!this.isFirefox && node.nodeName.toLowerCase() === 'svg') {
      let x = parseInt(node.getAttribute('x', 10));
      let y = parseInt(node.getAttribute('y', 10));
      let width = parseInt(node.getAttribute('width'), 10);
      let height = parseInt(node.getAttribute('height'), 10);

      node.style.top = y * viewport.scale + 'px';
      node.style.left = x * viewport.scale + 'px';

      node.setAttribute('x', x * viewport.scale);
      node.setAttribute('y', y * viewport.scale);

      node.setAttribute('width', width * viewport.scale);
      node.setAttribute('height', height * viewport.scale);
    }

    return node;
  }

  generateUniqSvgName() {
    return uuid();
  }

  appendChild(svg: any, annotation: any, viewport?: any, dispachSave = true) {
    if (!viewport) {
      viewport = JSON.parse(svg.getAttribute('data-pdf-annotate-viewport'));
    }

    let child;
    switch (annotation.type) {
      case 'area':
        child = this.render.renderRect(annotation);
        break;
      case 'signature':
        child = this.render.renderRect(annotation);
        break;
      case 'stamp':
        child = this.render.renderRect(annotation);
        break;
      case 'highlight':
        child = this.render.renderRect(annotation);
        break;
      case 'point':
        child = this.render.renderPoint(annotation);
        break;
      case 'textbox':
        child = this.render.renderText(annotation);
        break;
      case 'drawing':
        child = this.render.renderPath(annotation);
        break;
      case 'line':
        child = this.render.renderLine(annotation);
        break;
    }
    annotation.uuid = annotation.uuid || uuid();
    annotation.date = annotation.date || moment().format();
    if (child) {
      // Set attributes
      child.setAttribute('data-pdf-annotate-id', annotation.uuid);
      child.setAttribute('data-pdf-annotate-type', annotation.type);
      child.setAttribute('data-pdf-annotate-page', annotation.page);
      child.setAttribute('aria-hidden', true);
      if (annotation.valueComment) {
        this.addComment(annotation, {
          date: moment().format(),
          valueComment: annotation.valueComment,
          user: this.user,
        });
      }

      if (annotation.type === 'signature' || annotation.type === 'stamp') {
        if (!child.hasAttribute('data-pdf-annotate-viewport')) {
          child.setAttribute('data-pdf-annotate-viewport', JSON.stringify(viewport));
        }
        const doc = document.getElementsByTagName('iframe')[0].contentDocument;

        // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
        const page = doc.getElementsByClassName('page')[annotation.page - 1];
        page.insertBefore(
          this.transformSignature(child, viewport),
          page.querySelector('.annotationLayer')
        );
        child.dispatchEvent(new Event('click'));
        child.style.background = 'rgba(37, 174, 136, 0.4)';
      } else {
        svg.appendChild(this.transform(child, viewport));
      }
    }

    return child;
  }

  disableUserSelect() {
    if (document.getElementsByTagName('iframe')[0].contentDocument) {

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      document
        .getElementsByTagName('iframe')[0].contentDocument
        .getElementsByTagName('body')[0].classList
        .add('noSelectAll');
    }
  }

  enableUserSelect() {
    if (document.getElementsByTagName('iframe')[0].contentDocument) {

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      document
        .getElementsByTagName('iframe')[0].contentDocument
        .getElementsByTagName('body')[0].classList
        .remove('noSelectAll');
    }
  }

  getAnnotationRect(el: HTMLElement) {
    let h = 0, w = 0, x = 0, y = 0;
    const rect = el.getBoundingClientRect() as any;
    const LINE_OFFSET = 16;

    switch (el.nodeName.toLowerCase()) {
      case 'path':
        let minX: any, maxX: any, minY: any, maxY: any;


        // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
        el.getAttribute('d').replace(/Z/, '').split('M').splice(1).forEach((p) => {
          const s = p.split(' ').map(i => parseInt(i, 10));

          if (typeof minX === 'undefined' || s[0] < minX) {
            minX = s[0];
          }
          if (typeof maxX === 'undefined' || s[2] > maxX) {
            maxX = s[2];
          }
          if (typeof minY === 'undefined' || s[1] < minY) {
            minY = s[1];
          }
          if (typeof maxY === 'undefined' || s[3] > maxY) {
            maxY = s[3];
          }
        });

        h = maxY - minY;
        w = maxX - minX;
        x = minX;
        y = minY;
        break;

      case 'line':

        // @ts-ignore @ts-expect-error TS(2345): Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
        h = parseInt(el.getAttribute('y2'), 10) - parseInt(el.getAttribute('y1'), 10);

        // @ts-ignore @ts-expect-error TS(2345): Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
        w = parseInt(el.getAttribute('x2'), 10) - parseInt(el.getAttribute('x1'), 10);

        // @ts-ignore @ts-expect-error TS(2345): Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
        x = parseInt(el.getAttribute('x1'), 10);

        // @ts-ignore @ts-expect-error TS(2345): Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
        y = parseInt(el.getAttribute('y1'), 10);

        if (h < 0) {
          y += h;
          h *= -1;
        }

        if (w < 0) {
          x += w;
          w *= -1;
        }

        if (h === 0) {
          h += LINE_OFFSET;
          y -= (LINE_OFFSET / 2);
        }
        break;

      case 'text':
        h = rect.height;
        w = rect.width;

        // @ts-ignore @ts-expect-error TS(2345): Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
        x = parseInt(el.getAttribute('x'), 10);

        // @ts-ignore @ts-expect-error TS(2345): Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
        y = parseInt(el.getAttribute('y'), 10) - (parseInt(el.getAttribute('font-size'), 10) );
        break;

      case 'g':
        const {offsetLeft, offsetTop} = this.getOffset(el);
        h = rect.height;
        w = rect.width;
        x = rect.left - offsetLeft;
        y = rect.top - offsetTop;

        if (el.getAttribute('data-pdf-annotate-type') === 'strikeout') {
          h += LINE_OFFSET;
          y -= (LINE_OFFSET / 2);
        }
        break;

      case 'rect':
      case 'svg':
      case 'img':

        // @ts-ignore @ts-expect-error TS(2345): Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
        h = parseInt(el.getAttribute('height'), 10);

        // @ts-ignore @ts-expect-error TS(2345): Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
        w = parseInt(el.getAttribute('width'), 10);

        // @ts-ignore @ts-expect-error TS(2345): Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
        x = parseInt(el.getAttribute('x'), 10);

        // @ts-ignore @ts-expect-error TS(2345): Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
        y = parseInt(el.getAttribute('y'), 10);
        break;
    }

    let result = {
      top: y,
      left: x,
      width: w,
      height: h,
      right: x + w,
      bottom: y + h
    };

    if (!['svg', 'g'].includes(el.nodeName.toLowerCase())) {
      result = this.scaleUp(this.findSVGAtPoint(rect.left, rect.top), result);
    }

    return result;
  }

  scaleUp(svg: any, rect: any) {
    let result = {...rect};
    let viewport = this.getMetadata(svg).viewport;

    Object.keys(rect).forEach((key) => {
      result[key] *= viewport.scale;
    });

    return result;
  }

  getOffset(el: any) {
    let parentNode = el;

    while ((parentNode = parentNode.parentNode) &&
    parentNode !== document) {
      if (parentNode.nodeName.toUpperCase() === 'SVG') {
        break;
      }
    }

    let rect = parentNode.getBoundingClientRect();

    return {offsetLeft: rect.left, offsetTop: rect.top};
  }

  offSelect() {
    const disableselect = (e: any) => {
      return false;
    }
     const reEnable = () => {
      return true;
    }

    // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
    document.getElementsByTagName('iframe')[0].contentDocument['onselectstart'] = () => false;


    // @ts-ignore @ts-expect-error TS(7015): Element implicitly has an 'any' type because index... Remove this comment to see the full error message
    if (window['sidebar']) {

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      document.getElementsByTagName('iframe')[0].contentDocument.onmousedown = disableselect;

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      document.getElementsByTagName('iframe')[0].contentDocument.onclick = reEnable;
    }
  }

  onSelect() {
    const disableselect = (e: any) => {
      return true;
    }
    const reEnable = () => {
      return true;
    }

    // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
    document.getElementsByTagName('iframe')[0].contentDocument['onselectstart'] = () => true;


    // @ts-ignore @ts-expect-error TS(7015): Element implicitly has an 'any' type because index... Remove this comment to see the full error message
    if (window['sidebar']) {

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      document.getElementsByTagName('iframe')[0].contentDocument.onmousedown = disableselect;

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      document.getElementsByTagName('iframe')[0].contentDocument.onclick = reEnable;
    }
  }

  addComment(annotation: any, comment: any, dynamicAdd?: any) {
    if (!this.comments[annotation.uuid]) {
      this.comments[annotation.uuid] = [comment];
    } else {
      this.comments[annotation.uuid].push(comment);
    }

    if (dynamicAdd) {
      this.refreshComments(annotation.uuid);
    }
  }

  deleteComment(annotationId: any) {
    for (const i in this.comments) {
      if (i === annotationId) delete this.comments[i];
    }
  }

  closeCommentsWindow() {
    const doc = document.getElementsByTagName('iframe')[0].contentDocument;

    // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
    if (doc.getElementById('commentsWindow'))

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      doc.getElementsByTagName('body')[0].removeChild(doc.getElementById('commentsWindow'));
  }

  refreshComments(annotateId: any, element?: any) {
    const doc = document.getElementsByTagName('iframe')[0].contentDocument;
    let parentCommentsDiv = element || false;
    if (!parentCommentsDiv) {

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      parentCommentsDiv = doc.getElementById('commentsAll');
    }
    while (parentCommentsDiv.firstChild) {
      parentCommentsDiv.removeChild(parentCommentsDiv.firstChild);
    }

    // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
    (doc.getElementById('inputCW') as HTMLInputElement).value = '';

    if (this.comments[annotateId]) {
      this.comments[annotateId].forEach((comment) => {
        const commentsDiv = document.createElement('div');
        commentsDiv.classList.add('wes');
        commentsDiv.style.width = '266px';
        commentsDiv.style.borderRadius = '15px';
        commentsDiv.style.borderBottomRightRadius = '0px';
        commentsDiv.style.backgroundColor = '#efefef';
        commentsDiv.style.wordBreak = 'break-word';
        commentsDiv.style.padding = '10px';
        commentsDiv.style.marginTop = '10px';
        commentsDiv.style.marginLeft = '10px';
        const p = document.createElement('p');
        p.textContent = comment.valueComment;
        p.style.fontSize = '13px';
        const dateDiv = document.createElement('div');
        dateDiv.classList.add('wes');
        dateDiv.style.width = '50';
        dateDiv.style.marginTop = '10px';
        dateDiv.style.marginRight = '5px';
        dateDiv.style.marginLeft = 'auto';
        dateDiv.style.color = 'lightgray';
        dateDiv.style.width = 'max-content';
        dateDiv.style.whiteSpace = 'nowrap';
        dateDiv.style.fontSize = '10px';
        dateDiv.textContent = comment.date.slice(0, comment.date.indexOf('+')).replace(comment.date[10], ' ') + '  ' + comment.user;
        commentsDiv.appendChild(p);
        parentCommentsDiv.appendChild(commentsDiv);
        parentCommentsDiv.appendChild(dateDiv);
      });
    }
  }

  openCommentsWindow(annotateId: any) {
    const doc = document.getElementsByTagName('iframe')[0].contentDocument;

    // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
    if (doc.getElementById('commentsWindow')) {

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      doc.getElementById('commentsWindow').remove();
    }
    this.commentsWindow = document.createElement('div');
    this.commentsWindow.id = 'commentsWindow';
    this.commentsWindow.style.position = 'absolute';
    this.commentsWindow.style.transition = '0.3s';
    this.commentsWindow.style.width = '300px';
    this.commentsWindow.style.boxShadow = '0px 0px 4.75px 0.25px rgba(0, 1, 0, 0.25)';
    this.commentsWindow.style.height = '420px';
    this.commentsWindow.paddingTop = '11px';
    this.commentsWindow.style.right = '10px';
    this.commentsWindow.style.borderTopRightRadius = '20px';
    this.commentsWindow.style.bottom = '10px';
    this.commentsWindow.color = 'black';
    this.commentsWindow.style.background = 'rgb(255, 209, 0)';

    const icon = document.createElement('img');
    icon.src = '../../../assets/imgs/commentsIcon.svg';
    icon.style.width = '17.5px';
    icon.style.marginLeft = '10px';
    icon.style.display = 'inline-block';
    icon.style.height = '17.5px';

    this.commentsWindow.appendChild(icon);

    const newComment = document.createElement('p');
    newComment.textContent = 'Комментарии';
    newComment.style.marginTop = '10px';
    newComment.style.display = 'inline-block';
    newComment.style.marginLeft = '10px';

    this.commentsWindow.appendChild(newComment);

    const parentCommentsDiv = document.createElement('div');
    parentCommentsDiv.classList.add('wes');
    parentCommentsDiv.id = 'commentsAll';
    parentCommentsDiv.style.width = '300px';
    parentCommentsDiv.style.overflow = 'overlay';


    // @ts-ignore @ts-expect-error TS(7015): Element implicitly has an 'any' type because index... Remove this comment to see the full error message
    parentCommentsDiv.style['::-webkit-scrollbar'] = 'overlay';
    parentCommentsDiv.style.paddingTop = '1px';
    parentCommentsDiv.style.height = '324px';
    parentCommentsDiv.style.background = 'white';
    parentCommentsDiv.style.marginTop = '10px';


    this.commentsWindow.appendChild(parentCommentsDiv);

    const pNewComment = document.createElement('div');
    pNewComment.style.width = '300px';
    pNewComment.style.height = '65px';


    const addComment = document.createElement('div');
    addComment.style.width = '60px';
    addComment.classList.add('wes');
    addComment.style.height = '30px';
    addComment.style.background = 'white';

    const addCommentInput = document.createElement('input');
    addCommentInput.id = 'inputCW';
    addCommentInput.classList.add('wes');
    addCommentInput.style.borderWidth = '1px';
    addCommentInput.style.paddingLeft = '10px';
    addCommentInput.style.fontFamily = 'Golos Regular';
    addCommentInput.style.fontSize = '13px';
    addCommentInput.placeholder = 'Введите комментарий и нажмите Enter';
    addCommentInput.style.borderColor = 'rgb(179, 147, 0)';
    addCommentInput.style.borderRadius = '5px';
    addCommentInput.style.borderStyle = 'solid';
    addCommentInput.style.backgroundColor = 'white';
    addCommentInput.style.marginTop = '12px';
    addCommentInput.style.marginLeft = '10px';
    addCommentInput.style.width = '268px';
    addCommentInput.style.height = '33px';
    addCommentInput.onkeydown = (e) => {
      if (e.keyCode === 13) {
        this.addComment({
          uuid: annotateId,
        }, {
          user: this.user,
          name: this.generateUniqSvgName(),

          // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
          valueComment: (doc.getElementById('inputCW') as HTMLInputElement).value,
          date: moment().format()
        }, true);
      }
    };
    pNewComment.appendChild(addCommentInput);

    this.commentsWindow.appendChild(pNewComment);

    // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
    doc.getElementsByTagName('body')[0].appendChild(this.commentsWindow);
    this.refreshComments(annotateId, parentCommentsDiv);
  }

  changeTextContent(uuId: string, content: any) {
    this.annotationsObject.annotations.forEach((el) => {
      if (el['uuid'] === uuId) {
        el['content'] = content.replace('|', '');
      }
    });

  }

}
