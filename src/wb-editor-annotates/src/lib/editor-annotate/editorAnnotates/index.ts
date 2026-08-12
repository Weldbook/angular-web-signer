import {Pen} from '../UI/pen';
import {Line} from '../UI/line';
import {TextE} from '../UI/text';
import {Rect} from '../UI/rect';
import {Edit} from '../UI/edit';
import {Injectable} from '@angular/core';
import {Point} from '../UI/point';
import {Stamp} from '../UI/stamp';
// import {Comments} from '../UI';

export interface ConfigEditor {
  properties: Properties;
}

export interface Property {
  size: string | number;
  color: string | any;
}

export interface Properties {
  [propName: string]: Property;
}

@Injectable()
export class EditorAnnotates {

  keyUpBind = this.handleKeyUpBind.bind(this);

  public pen = new Pen();
  public text = new TextE();
  public line = new Line();
  public rect = new Rect();
  public signature = new Rect();
  public stamp = new Stamp();
  public edit = new Edit();
  public point = new Point();

  constructor(
  ) {}

  public InitEditor(cfg: ConfigEditor) {
    this.setProperties(cfg.properties);
    this.doAction(false, 'cursor');
    this.StartGlobalListeners();
  }

  private StartGlobalListeners() {
    const newDoc = document.getElementsByTagName('iframe')[0].contentDocument;

    // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
    newDoc.addEventListener('keyup', this.keyUpBind);
  }

  private handleKeyUpBind(e: any) {
    if (e.keyCode === 27 ) {
      const btn = document.getElementsByClassName('cursor')[0] as HTMLElement;
      if (!btn.className.includes('active')) {
        btn.click();
      }
    }
  }

  private setCursor(type: string, action?: string): void {
    const frame = document.getElementsByTagName('iframe')[0].contentDocument;
    let padding = '';
    if (type === 'cross') {
      padding = '10 10';
    }

    if (type === 'pointer') {

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      frame.getElementsByTagName('body')[0]['style'].cursor = type;
    }
    // else if (type === 'stamp') {
    //   frame.getElementsByTagName('body')[0]['style'].cursor =
    //     'url("http://localhost:4200/assets/imgs/icons_instruments_editor/editor_annotates/stamp.png") ' + padding + ', auto';
    // }
    else {

      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      frame.getElementsByTagName('body')[0]['style'].cursor =
        'url("/assets/imgs/cursors/cursor_' + type + '_19px.png") ' + padding + ', auto';
    }

    // frame.getElementsByTagName('body')[0]['style'].cursor =
    //   type === 'pointer' ? type : 'url("/assets/imgs/cursors/cursor_' + type + '_19px.png") ' + padding + ', auto';

    if (type === 'pointer') {
      document.getElementsByTagName('html')[0]['style'].cursor = type;
    }
    // else if (type === 'stamp') {
    //   document.getElementsByTagName('html')[0]['style'].cursor =
    //     'url("http://localhost:4200/assets/imgs/icons_instruments_editor/editor_annotates/stamp.png") ' + padding + ', auto';
    // }
    else {
      document.getElementsByTagName('html')[0]['style'].cursor =
        'url("/assets/imgs/cursors/cursor_' + type + '_19px.png") ' + padding + ', auto';
    }



    // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
    frame.getElementsByClassName('textLayer')[0]['style'].display = 'none';

    if (!action) {


      // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
      frame.getElementsByClassName('textLayer')[0]['style'].display = 'block';
    }
  }

  public doAction(button: any, action: any): void {
    let actives: any = [];

    if (button) {
      actives = document.querySelectorAll('.toolbar div.active');
    }
    this.setCursor('arrow');
    if (actives.length !== 0) {
      for (let but = 0; but < actives.length; but++) {
        actives[but].classList.remove('active');
        switch (actives[but].getAttribute('data-tooltype')) {
          case 'cursor':
            this.edit.disableEdit();
            break;
          case 'pen':
            this.pen.disablePen();
            break;
          case 'text':
            this.text.disableText();
            break;
          case 'point':
            this.point.disablePoint();
            break;
          case 'line':
            this.line.disableLine();
            break;
          case 'stamp':
            this.stamp.disableStamp();
            this.rect.disableRect();
            break;
          case 'area':
          case 'signature':
          case 'highlight':
            this.rect.disableRect();
            break;
        }
      }
    }

    if (button) {
      if (button.nodeName === 'svg' ||
          button.nodeName === 'use' ||
          button.nodeName === 'path') {

      } else {
        button.classList.add('active');
      }
    }

    switch (action) {
      case 'cursor':
        this.edit.enableEdit()
        // this.setCursor('arrow');
        break;
      case 'point':
        this.point.enablePoint();
        break;
      case 'area':
        this.setCursor('cross', action);
        this.rect.enableRect(action);
        break;
      case 'signature':
        this.setCursor('cross', action);
        this.rect.enableRect(action);
        break;
      case 'stamp':
        this.setCursor('cross', 'signature');
        this.stamp.enableStamp(action);
        break;
      case 'highlight' :
        this.rect.enableRect(action);
        break;
      case 'line':
        this.setCursor('cross', action);
        this.line.enableLine();
        break;
      case 'pen':
        this.setCursor('cross', action);
        this.pen.enablePen();
        break;
      case 'text':
        this.text.enableText();
        break;
    }
  }

  public setProperties(properties: Properties) {
    for (let prop in properties) {


      // @ts-ignore @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      this[prop]['set' + prop](properties[prop].size, properties[prop].color);
    }
  }

  public changeInst(type: any, size?: any, color?: any): void {


    // @ts-ignore @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    this[type === 'area' || type === 'signature' ? 'rect' : type]['set' + type](size, color);
  }
}
