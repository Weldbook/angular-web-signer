export class Render {
  REGEX_HASHLESS_HEX = /^([a-f0-9]{6}|[a-f0-9]{3})$/i;
  UPPER_REGEX = /[A-Z]/g;
  BLACKLIST = [
    'viewBox'
  ];

  keyCase = (key: any) => {
    if (this.BLACKLIST.indexOf(key) === -1) {
      key = key.replace(this.UPPER_REGEX, (match: any) => '-' + match.toLowerCase());
    }
    return key;
  }

  setAttributes(node: any, attributes: any) {
    Object.keys(attributes).forEach((key) => {
      node.setAttribute(this.keyCase(key), attributes[key]);
    });
  }

  normalizeColor(color: any) {
    if (this.REGEX_HASHLESS_HEX.test(color)) {
      color = `#${color}`;
    }
    return color;
  }

  createRect(r: any) {
    let rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    this.setAttributes(rect, {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height
    });

    return rect;
  }

  renderRect(a: any) {
    if (a.type === 'highlight') {
      let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.setAttributes(group, {
        fill: this.normalizeColor(a.color || '#ff0'),
        fillOpacity: 0.2
      });

      a.rectangles.forEach((r: any) => {
        group.appendChild(this.createRect(r));
      });

      return group;
    } else {
      let rect = this.createRectType(a);

      this.setAttributes(rect, {
        stroke: this.normalizeColor(a.color || '#f00'),
        fill: a.type === 'area' ? 'none' : 'rgba(37, 174, 136, 0.1)'
      });

      return rect;
    }
  }

  createRectType(a: any): any {
    if (a.type === 'signature') {
      return this.createSignature(a);
    } else if (a.type === 'stamp') {
      return this.createStamp(a);
    } else {
      return this.createRect(a);
    }
  }

  createSignature(r: any) {
    let signature = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    this.setAttributes(signature, {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      'data-pdf-annotate-container': 'true',
    });
    signature.style.position = 'absolute';
    signature.style.top = (r.x) + 'px';
    signature.style.left = (r.y) + 'px';
    signature.style.background = r.fill;
    signature.style.border = `1px solid rgba(37, 174, 136, 0.5)`;
    signature.style.borderRadius = '25px';
    signature.onfocus = _ => {
      signature.style.background = 'rgba(37, 174, 136, 0.4)';
    }
    // signature.classList.add('wb-pdf-annotation-layer');

    return signature;
  }

  createStamp(r: any) {
    let stamp = document.createElementNS('http://www.w3.org/2000/svg', 'image');

    this.setAttributes(stamp, {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      'xlink:href': 'http://localhost:4200/assets/imgs/icons_instruments_editor/editor_annotates/stamp.png',
      'data-pdf-annotate-container': 'true',
    });
    stamp.style.position = 'absolute';
    stamp.style.top = (r.x) + 'px';
    stamp.style.left = (r.y) + 'px';
    stamp.style.width = (r.width) + 'px';
    stamp.style.height = (r.height) + 'px';

    return stamp;
  }

  renderLine(a: any) {
    const line = this.createLine(a);
    this.setAttributes(line, {
      stroke: this.normalizeColor(a.color || '#f00'),
      fill: 'none'
    });

    return line;
  }

  createLine(a: any) {
    const doc = document.getElementsByTagName('iframe')[0].contentDocument;

    // @ts-ignore @ts-expect-error TS(2531): Object is possibly 'null'.
    const line = doc.createElementNS('http://www.w3.org/2000/svg', 'line');

    this.setAttributes(line, {
      x1: a.start[0],
      y1: a.start[1],
      x2: a.end[0],
      y2: a.end[1],
      'stroke-width': a.width
    });

    return line;
  }

  renderPath(a: any) {
    let d:any[] = [];
    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    for (let i=0, l=a.lines.length; i<l; i++) {
      const p1 = a.lines[i];
      const p2 = a.lines[i+1];
      if (p2) {
        d.push(`M${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`);
      }
    }

    this.setAttributes(path, {
      d: `${d.join(' ')}Z`,
      stroke: this.normalizeColor(a.color || '#000'),
      strokeWidth: a.width || 1,
      fill: 'none'
    });

    return path;
  }

  renderText(a: any) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    this.setAttributes(text, {
      x: a.x,
      y: a.y + parseInt(a.size, 10),
      fill: this.normalizeColor(a.color || '#000'),
      fontSize: a.size
    });
    text.style.fontSize = a.size + 'pt';
    text.innerHTML = a.content;

    return text;
  }

  renderPoint(a: any) {
    const SIZE = 25;
    const D = 'M499.968 214.336q-113.832 0 -212.877 38.781t-157.356 104.625 -58.311 142.29q0 62.496 39.897 119.133t112.437 97.929l48.546 27.9 -15.066 53.568q-13.392 50.778 -39.06 95.976 84.816 -35.154 153.45 -95.418l23.994 -21.204 31.806 3.348q38.502 4.464 72.54 4.464 113.832 0 212.877 -38.781t157.356 -104.625 58.311 -142.29 -58.311 -142.29 -157.356 -104.625 -212.877 -38.781z';
    const doc = document.getElementsByTagName('iframe')[0].contentDocument;
    const outerSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const innerSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    this.setAttributes(outerSVG,  {
      width: SIZE,
      height: SIZE,
      x: a.x,
      y: a.y
    });

    this.setAttributes(innerSVG, {
      width: SIZE,
      height: SIZE,
      x: 0,
      y: (SIZE * 0.05) * -1,
      viewBox: '0 0 1000 1000'
    });

    this.setAttributes(rect, {
      width: SIZE,
      height: SIZE,
      stroke: '#000',
      fill: '#ff0'
    });

    this.setAttributes(path, {
      d: D,
      strokeWidth: 50,
      stroke: '#000',
      fill: '#fff'
    });

    innerSVG.appendChild(path);
    outerSVG.appendChild(rect);
    outerSVG.appendChild(innerSVG);

    return outerSVG;
  }
}
