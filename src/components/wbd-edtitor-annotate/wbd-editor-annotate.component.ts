// @ts-nocheck
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import moment from 'moment';
import { PdfJsViewerComponent } from 'ng2-pdfjs-viewer';
import { Certificate, getUserCertificates, } from 'crypto-pro';
import { v4 as uuid } from 'uuid';
import { HttpClient } from '@angular/common/http';
import { CloseFileComponent } from '../close-file/close-file.component';
import { WbSuggestedEmployeesComponent } from '../wb-suggested-employees/wb-suggested-employees.component';
import { SignatureInfoComponent } from '../signature-info/signature-info.component';
import { SettingsComponent } from '../settings/settings.component';
import { filter } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EditorDocument, EditorDocumentSourceType } from '../../editor-document';
import { EditorSignerService, SignatureObject } from '../../editor-signer.service';
import {
  WBD_EDITOR_CONFIG,
  WBD_COMMENTS,
  WBD_ANNOTATIONS_OBJECT,
  WBD_EDITOR_ANNOTATES,
} from '../../editor-tokens';
import { ExtendedCertificate } from 'src/signer/models';


@Component({
  selector: 'app-wbd-editor-annotate',
  templateUrl: './wbd-editor-annotate.component.html',
  styleUrls: ['./wbd-editor-annotate.component.scss'],
})
export class WbdEditorAnnotateComponent implements OnInit {
  @Output() isClosedFile: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChild(PdfJsViewerComponent, { static: true }) pdfViewer: PdfJsViewerComponent | undefined;

  pages = [];
  PDFViewerApplication!: { pdfDocument: { getPage: (arg0: number) => Promise<any>; }; pdfViewer: { getPageView: (arg0: number) => any; }; };
  annotationsArray = [];
  originalAnnotationsArray = [];
  originalComments = {};
  pageInsertedObs!: Observable<any>;
  pdfFileInput = document.createElement('input') as HTMLInputElement;
  viewerIframe!: HTMLIFrameElement;
  frameLoaded = false;
  fileId = '';
  allVersions = [];
  currentVersion = 0;
  filename!: string;

  instruments = {
    pen: 'Кисть',
    pen1: 'кисти',
    text: 'Текст',
    text1: 'шрифта',
    highlight: 'Выделение текста',
    highlight2: 'Выделение текста',
    area: 'Рамка',
    area1: 'рамки',
    area2: 'Добавление рамки',
    signature: 'Подпись',
    signature1: 'Подписи',
    signature2: 'Место для подписи',
    stamp: 'Штамп',
    stamp1: 'Штампы',
    stamp2: 'Штамп для подписи',
    line: 'Линия',
    line1: 'линии',
    cursor: 'Перемещение',
    cursor2: 'Перемещение объектов',
    comment: 'Комментарий',
  };

  sizesPen = [2, 4, 8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96];
  sizeText = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

  penSize = +(localStorage.getItem('editorAnnotate-penSize') ?? 4);
  textSize = +(localStorage.getItem('editorAnnotate-textSize') ?? 8);
  lineSize = +(localStorage.getItem('editorAnnotate-lineSize') ?? 1);
  penColor = localStorage.getItem('editorAnnotate-penColor') ?? 'red';
  lineColor = localStorage.getItem('editorAnnotate-lineColor')
    ? localStorage.getItem('editorAnnotate-lineColor')
    : 'red';
  textColor = localStorage.getItem('editorAnnotate-textColor')
    ? localStorage.getItem('editorAnnotate-textColor')
    : '#000000';
  areaColor = localStorage.getItem('editorAnnotate-areaColor')
    ? localStorage.getItem('editorAnnotate-areaColor')
    : 'red';

  currentActiveColor!: string;
  currentActiveSize!: string;
  currentActionActive = 'cursor';
  editorConfig = {
    properties: {
      pen: {
        size: this.penSize,
        color: this.penColor,
      },
      text: {
        size: this.textSize,
        color: this.textColor,
      },
      line: {
        size: this.lineSize,
        color: this.lineColor,
      },
    },
  };
  acceptDialogRef!: { afterClosed: () => { (): any; new(): any; subscribe: { (arg0: (yea: any) => void): void; new(): any; }; }; };
  documentContent: Iterable<number> | BlobPart | null | undefined;
  apiUrl: string;
  certificates!: ExtendedCertificate[];
  currentSign!: SignatureObject;
  signErrors = [];
  creatingSignature = false;
  iconOrganization = 'ngs';

  activeSigns = [];

  private annotationsSignArray!: any[] = [];
  private _comments: Record<string, any[]>;
  private _annotationsObject: Record<string, any>;
  editorFiles!: EditorDocument[];
  activeDocumentIndex = 0;

  constructor(
    public route: ActivatedRoute,
    private router: Router,
    @Inject(WBD_EDITOR_ANNOTATES) public editor: EditorAnnotates,
    private dialog: MatDialog,
    private renderer2: Renderer2,
    private http: HttpClient,
    private cdRef: ChangeDetectorRef,
    private snack: MatSnackBar,
    private signerService: EditorSignerService,
    @Inject(WBD_EDITOR_CONFIG) config: { signerServiceUrl?: string; apiUrl?: string },
    @Inject(WBD_COMMENTS) comments: Record<string, any[]>,
    @Inject(WBD_ANNOTATIONS_OBJECT) annotationsObject: Record<string, any>
  ) {
    this.setScript();
    this.apiUrl = config?.apiUrl || '';
    this._comments = comments;
    this._annotationsObject = annotationsObject;
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any) {
    let result = confirm('Изменения не будут сохранены.');
    event.returnValue = !!result;
  }

  loadEditorDocument(document: EditorDocument) {
    console.log(this.annotationsObject);
    let link;
    this.destroyAnnotations();
    if (document.content) {
      this.documentContent = document.content;
      this.pdfViewer.pdfSrc = new Uint8Array(document.content);
      this.pdfViewer.refresh();
      this.cdRef.detectChanges();
      return;
    }
    switch (document.sourceType) {
      case EditorDocumentSourceType.FileLink:
        link = document.source as string;
        this.http.get(link, { responseType: 'arraybuffer' }).subscribe(fileData => {
          this.pdfViewer.pdfSrc = new Blob([fileData]);
          document.content = fileData;
          this.documentContent = fileData;
        });
        break;
      case EditorDocumentSourceType.ArrayBuffer:
        this.pdfViewer.pdfSrc = new Uint8Array(document.source);
        document.content = document.source;
        this.documentContent = document.source;
        break;
      case EditorDocumentSourceType.Uint16Array:
        this.pdfViewer.pdfSrc = document.source;
        document.content = (document.source as Uint16Array).buffer;
        this.documentContent = (document.source as Uint16Array).buffer;
        break;
      case EditorDocumentSourceType.Blob:
      default:
        const fileName = document.filename;
        this.filename = fileName || 'Подписанный документ.pdf';
        this.pdfViewer.pdfSrc = document.source;
        document.source.arrayBuffer().then((value) => {
          document.content = value;
          this.documentContent = value;
        });
        break;
    }
    this.getDocumentInfo(document);
    this.pdfViewer.refresh();
    this.cdRef.detectChanges();
  }

  // region LifeHooks
  ngOnInit(): void {
    if (this.editor && this.pdfViewer) {
      this.viewerIframe = this.pdfViewer.iframe.nativeElement as HTMLIFrameElement;
      this.viewerIframe.contentWindow['pdfWorkerSrc'] = '../build/pdf.worker2.js';
      this.viewerIframe.onload = (e) => {
        const viewer = e.target as HTMLFrameElement;
        if (viewer.contentDocument.getElementById('viewer')) {
          this.iframeLoaded(e);
        }
      };
      let tmpFiles = JSON.parse(localStorage.getItem('editorFiles')) || [];
      this.editorFiles = tmpFiles.map((x: any) => new EditorDocument(x));
      document.body.style.height = '100%';
      if (this.editorFiles) {
        this.choseActiveDocument(0);
        this.editorFiles.forEach(doc => this.getDocumentInfo(doc));
      }

    }
  }

  choseActiveDocument(index: number) {
    if (this.editorFiles[index]) {
      let activeDocument = this.editorFiles[index];
      this.activeDocumentIndex = index;
      this.loadEditorDocument(activeDocument);
    }
  }

  ngOnDestroy() {
    // this.unsubscribeAnnotations();
    // if (this.editor) {
    //   this.editor.edit.deleteAnnotationsListeners();
    // }
  }

  // endregion

  // region Page
  setScript() {
    const cadespluginScript = this.renderer2.createElement('script');
    cadespluginScript.src = '/static/cadesplugin_api.js';
    cadespluginScript.language = 'javascript';
    this.renderer2.appendChild(document.head, cadespluginScript);
  }

  observeViewerPages() {
    if (this.viewerIframe) {
      this.pageInsertedObs = new Subject();
      const _this = this;
      const viewer = this.viewerIframe.contentDocument.getElementById('viewer');
      if (viewer) {
        const mutationObserver = new MutationObserver(function (mutations) {
          mutations.forEach(function (mutation) {
            console.log('Element added:', mutation.addedNodes);
            for (let i = 0; i < mutation.addedNodes.length; i++) {
              let target = mutation.addedNodes[i]
              _this.pageInsertedObs.next({ target });
            }
          });
        });
        mutationObserver.observe(viewer, {
          attributes: false,
          childList: true,
          characterData: true,
          subtree: true
        });
      }
    }
  }

  onPdfViewerInit() {
    this.PDFViewerApplication = this.viewerIframe.contentWindow['PDFViewerApplication'];
    this.observeViewerPages();
    this.pageCreatedEventSub();
    this.subscribeToAnnotations();
    this.getDocumentAnnotations();
  }

  getDocumentInfo(doc: EditorDocument) {
    console.log(doc);
      if (doc.signedContent) {
        this.pdfViewer.pdfSrc = new Uint8Array(doc.signedContent);
        this.pdfViewer.refresh();
        this.cdRef.detectChanges();
        return;
      }
      return;
  }

  downloadRevisionSignature() {
    // Archived revision download was served by the (removed) file-management
    // service. Re-implement it against your backend if you need it.

  }

  getDocumentSignatures(doc: EditorDocument) {
  }

  pageCreatedEventSub() {
    if (this.viewerIframe) {
      if (!this.pageInsertedObs) {
        this.observeViewerPages();
      }
      if (this.pageInsertedObs) {
        this.pageInsertedObs.pipe(filter(x => x?.target)).subscribe((e) => {
          const target = e.target as HTMLElement;
          if (target.className === 'textLayer') {
            this.pageRendered(target.parentElement);
          } else if (
            target['hasAttribute'] !== undefined &&
            target.hasAttribute('data-pdf-annotate-type') &&
            target.getAttribute('data-pdf-annotate-type') === 'signature'
          ) {
            let createdSignatures = this.createSignatureObject(target);
            target.onclick = (_) => {
              this.getSign(
                this.annotationsSignArray.find((x) => {
                  return (
                    x.hasOwnProperty('pdfAnnotateId') && x.pdfAnnotateId === target.getAttribute('data-pdf-annotate-id')
                  );
                })
              );
            };
            this.annotationsSignArray.push(createdSignatures);
            this.getSign(createdSignatures);
          }
        });
      }
    }
  }

  iframeLoaded(event: Event) {
    this.onPdfViewerInit();
    this.addCustomHtml();
    this.frameLoaded = true;
  }

  closeFile() {
    const matDialog = this.dialog.open(CloseFileComponent, {
      height: '150px',
      width: '440px',
    });

    matDialog.afterClosed().subscribe((data: boolean) => {
      if (data) {
        this.pdfViewer.pdfSrc = null;
        this.router.navigate(['/documents']);
        this.isClosedFile.emit(data);
        localStorage.removeItem('openFileId');
      } else {
        matDialog.close();
      }
    });

    return false;
  }

  // endregion

  // region Editor
  pageRendered(pageDom: HTMLElement) {
    const pageNum = pageDom.getAttribute('data-page-number');
    this.addSvgLayerToPage(pageDom);
    this.addAnnotationWorkLayerToPage(pageDom);
    this.drawAnnotationsArray(pageDom);

    this.PDFViewerApplication.pdfDocument.getPage(+pageNum).then((page: { getAnnotations: () => Promise<any>; }) => {
      page.getAnnotations().then((data: any[]) => {
        this.annotationsSignArray = data;
        const signs = data.filter((x: { fieldType: string; }) => x.fieldType === 'Sig');
        this.createSvgSignLayer(pageDom, signs);
      });
    });
    this.editor.InitEditor(this.editorConfig);
  }

  hashColor(color: string | string[]) {
    if (!color) {
      return null;
    }
    if (color[0] === '#') {
      return color;
    }
    if (color == 'red') {
      return '#FF0000';
    }
    if (color.length === 6) {
      return '#' + color;
    }
    const colors = color.match(/\d+/g);
    return (
      '#' +
      colors
        .map((value: string | number) => (+value).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    );
  }

  getSubject(type: any) {
    let ret;
    switch (type) {
      case 'area':
        ret = 'Прямоугольник';
        break;
      case 'signature':
        ret = 'Подпись';
        break;
      case 'stamp':
        ret = 'Штамп';
        break;
      case 'drawing':
        ret = 'Карандаш';
        break;
      case 'textbox':
        ret = 'Машинописный текст';
        break;
      case 'highlight':
        ret = 'Выделение';
        break;
      case 'line':
        ret = 'Линия';
        break;
    }
    return ret;
  }

  doAction(button: any, action: string) {
    this.currentActionActive = action;
    if (action === 'line' || action === 'pen' || action === 'text') {
      this.currentActiveColor = this[action + 'Color'];
      this.currentActiveSize = this[action + 'Size'];
    } else {
      this.currentActiveSize = '';
      this.currentActiveColor = '';
    }
    this.editor.doAction(button, action);
  }

  changeInst(type: string, cfg?: { size?: string | number; color?: any; }): void {
    const size = +cfg.size || this[type + 'Size'];
    const color = cfg.color || this[type + 'Color'];

    if (size !== this[type + 'Size']) {
      this[type + 'Size'] = size;
      localStorage.setItem('editorAnnotate-' + type + 'Size', '' + size);
    }
    if (color !== this[type + 'Color']) {
      this[type + 'Color'] = this.hashColor(color);
      localStorage.setItem('editorAnnotate-' + type + 'Color', color);
    }
    this.editor.changeInst(type, size, color);
  }

  // endregion

  // region Signature
  getSign(sign?: any): void {
    this.signerService.getCertificates().subscribe(certs => {
      this.certificates = certs;
    })
    if (sign) {
      if (!this.editorFiles[this.activeDocumentIndex].signatures?.some(x => x.pdfAnnotateId == sign.pdfAnnotateId))
        this.editorFiles[this.activeDocumentIndex].signatures?.push(sign);
    }
    // this.currentSign = sign || null;
  }

  async createSign(certificateObj: Certificate) {
    for (let editorFileIndex = 0; editorFileIndex < this.editorFiles.length; editorFileIndex++) {
      let currentEditorDocument = this.editorFiles[editorFileIndex];
      if (!currentEditorDocument.annotations.some(x => x.type == 'signature') && !currentEditorDocument.signatures?.some(x => !x.contents)) {
        continue;
      }
      let signFileID = currentEditorDocument.detachedSignatures[0]?.signatureFileId;
      let oldSignature = null;
      this.loadEditorDocument(currentEditorDocument);
      let currentSigIndex = currentEditorDocument.signatures?.findIndex(x => !x.contents);
      let currentSign = currentEditorDocument.signatures[currentSigIndex];
      try {
        this.creatingSignature = true;
        let signedData = await this.signerService.createSign(this.documentContent, certificateObj, currentSign, null, currentEditorDocument.signedContent)
        if (!signedData) {
          this.snack.open('Ошибка', 'Ошибка подписания!');
          continue;
        }
        debugger
        let documentVisualSigContent = signedData['documentVisualSigContent'];
        let signatureContent = signedData['signatureContent'];
        let documentContent = signedData['documentContent'];
        this.editorFiles[editorFileIndex].signedContent = documentVisualSigContent.buffer;
        currentEditorDocument.signatures[currentSigIndex].contents = signatureContent;
        this.downloadRevisionSignature();
        this.downloadContentAsFile(documentVisualSigContent, currentEditorDocument.filename + '_signed.pdf')
        this.downloadContentAsFile(signatureContent, currentEditorDocument.filename + '.sig')
        console.log('signatureContent created');
      } catch (error) {
        console.error(error);
        this.creatingSignature = false;
      }
    }
    this.creatingSignature = false;
    let newEditorDocs = this.editorFiles.map((x: EditorDocument) => {
      if (x.signedContent)
        x.signedContent = (new Uint8Array(x.signedContent)).toBase64();
      return x;
    });
    localStorage.setItem('editorFiles', JSON.stringify(newEditorDocs));
    this.ngOnInit();
  }

  openSettings(): void {
    this.dialog.open(SettingsComponent, { width: '600px' });
  }

  showError(message: string, e?: Error): void {
    console.error(e, message);
    alert(message + (e ? ': ' + e : '.'));
    this.creatingSignature = false;
  }

  async verify(sign: { fieldValue: { ByteRange: any; }; signType: string; signer: any; displayData: any; certData: any; }) {
    let sSignedMessage = this.getBase64SignContent(sign.fieldValue.ByteRange);
    let dataToVerify = this.getBase64CurrentSigns(sign.fieldValue.ByteRange);
    let oSignedData;
    try {
      oSignedData = await window['cadesplugin'].CreateObjectAsync('CAdESCOM.CadesSignedData');
      oSignedData.propset_ContentEncoding(window['cadesplugin'].CADESCOM_BASE64_TO_BINARY);
      oSignedData.propset_Content(dataToVerify);
      await oSignedData.VerifyCades(sSignedMessage, window['cadesplugin'].CADESCOM_CADES_T, true);
      sign.signType = 'CADES_T';
      return true;
    } catch (e) {
      console.error('Failed to verify CADES_T signature. Error: ', window['cadesplugin'].getLastError(e));
      try {
        await oSignedData.VerifyCades(sSignedMessage, window['cadesplugin'].CADESCOM_CADES_BES, true);
        sign.signType = 'CADES_BES';
        return true;
      } catch (e) {
        console.error('Failed to verify CADES_BES signature. Error: ', window['cadesplugin'].getLastError(e));
        return e;
      }
    } finally {
      let signers = await oSignedData.Signers;
      let displayData = await oSignedData.DisplayData;
      let certData = await oSignedData.Certificates;
      let contentEncoding = await oSignedData.ContentEncoding;
      let content = await oSignedData.Content;
      sign.signer = await signers.Item(1);
      sign.displayData = displayData;
      sign.certData = certData;
      console.log(sign);
    }
  }

  createSignatureObject(sign: HTMLElement) {
    const pageNumber = +sign.parentElement.getAttribute('data-page-number');
    const pageIndex = pageNumber - 1;
    const getPageView = this.PDFViewerApplication.pdfViewer.getPageView(pageIndex);
    const svgViewPort = getPageView.viewport;
    const rectSignSvg = this.rectPdfPosition(sign, svgViewPort);
    return {
      page: pageNumber,
      fieldName: 'Signature' + Math.max(this.editorFiles[this.activeDocumentIndex].signatures?.length, (this.annotationsSignArray?.length + 1)),
      fieldType: 'Sig',
      rect: rectSignSvg,
      pdfAnnotateId: sign.getAttribute('data-pdf-annotate-id'),
    };
  }

  getBase64CurrentSigns(byteRange: any[], buffer = this.documentContent) {
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    let binary = '';

    for (let i = byteRange[0]; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  getBase64SignContent(byteRange: number[]) {
    const bytes = new Uint8Array(this.documentContent);
    const signStart = byteRange[1] + byteRange[0] + 1;
    let binary = '';
    for (let i = signStart; i < byteRange[2]; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(
      binary
        .match(/\w{2}/g)
        .map((a) => {
          return String.fromCharCode(parseInt(a, 16));
        })
        .join('')
    );
  }

  base64ToArrayBuffer(base64: string): ArrayBuffer | SharedArrayBuffer {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  signatureSignersDataConverter(signers: any) {

  }

  createSvgSignLayer(pageDom: HTMLElement, signs: any[]) {
    const pageNumber = +pageDom.getAttribute('data-page-number');
    const pageIndex = pageNumber - 1;
    const getPageView = this.PDFViewerApplication.pdfViewer.getPageView(pageIndex);
    const svgViewPort = getPageView.viewport;
    svgViewPort.rotation = (svgViewPort.rotation - getPageView.pdfPageRotate) % 360;

    signs.forEach((sign) => {
      const rect = svgViewPort.convertToViewportRectangle(sign.rect).map((x: string) => parseInt(x));

      if (sign.fieldValue && sign.fieldValue.ByteRange) {
        this.verify(
          sign
        ).then((res) => {
          const isValid = !res.hasOwnProperty('message');
          const svg = this.createRectSign(rect, svgViewPort, sign, pageNumber, isValid);

          // TODO: поправить добавление ошибок для отображения pageRender
          !res.hasOwnProperty('message')
            ? svg.appendChild(this.addValidIcon(rect, svgViewPort))
            : this.checkSignErrorsArray(sign);

          if (svg) {
            pageDom.insertBefore(
              svg,
              pageDom.querySelector('.annotationLayer')
            );
          }
        });
      } else {
        // создание svg для места под подпись
        pageDom.insertBefore(
          this.createRectSign(rect, svgViewPort, sign, pageNumber, true),
          pageDom.querySelector('.annotationLayer')
        );
      }
    });
  }

  checkSignErrorsArray(sign: { id: any; }) {
    if (!this.signErrors.find((signErr) => signErr.id === sign.id)) {
      this.signErrors.push(sign);
    }
  }

  createRectSign(rect: number[], svgViewPort: { uuid: any; }, sign: { fieldValue: any; page: number; }, pageNumber: number, valid: boolean) {
    let svgBoxHeight = rect[1] - rect[3];
    let svgBoxWidth = rect[2] - rect[0];
    const svg = this.viewerIframe.contentDocument
      .createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGElement;
    svg.setAttribute('x', '' + rect[0]);
    svg.setAttribute('y', '' + rect[3]);
    svg.setAttribute('width', '' + svgBoxWidth);
    svg.setAttribute('height', '' + svgBoxHeight);
    svg.setAttribute('data-pdf-annotate-container', 'true');
    svg.setAttribute('data-pdf-annotate-id', svgViewPort.uuid || uuid());
    svg.setAttribute('data-pdf-annotate-viewport', JSON.stringify(svgViewPort));
    svg.setAttribute('data-pdf-annotate-page', pageNumber.toString());

    let borderRadius = svgBoxHeight / 5;
    svg.style.borderRadius = `${borderRadius}px`;
    svg.setAttribute('rx', '' + borderRadius);
    svg.style.borderWidth = Math.floor(svgBoxHeight / 100) + 'px';
    svg.style.borderStyle = 'solid';


    svg.onmouseover = (_) => {
      svg.classList.add('hovered-signature');
    };
    svg.onmouseleave = (_) => {
      svg.classList.remove('hovered-signature');
    };

    // svg.classList.add('wb-pdf-annotation-layer');
    svg.style.position = 'absolute';
    svg.style.top = rect[3] + 'px';
    svg.style.left = rect[0] + 'px';

    if (sign) {
      if (!sign.fieldValue) {
        svg.onclick = (_) => {
          if (!sign.page) {
            sign.page = pageNumber;
          }
          this.getSign(sign || null);
        };
      } else {
        svg.onclick = (_) => {
          this.openSignatureInfo(sign).then(res => {
            console.log(res);
          });
          // svg.classList.remove('hovered-signature');
        };
      }

      this.addSvgColor(svg, valid, { valid: '0.06', invalid: '0.21' });
      svg.onfocus = (_) => this.addSvgColor(svg, valid, { valid: '0.06', invalid: '0.21' });
    }
    return svg;
  }

  async openSignatureInfo(signData: { fieldValue: { ByteRange: any; }; signer: any; signType: any; fieldName: any; }) {
    let oSignedData = await window['cadesplugin'].CreateObjectAsync('CAdESCOM.CadesSignedData');
    await oSignedData.propset_ContentEncoding(window['cadesplugin'].CADESCOM_BASE64_TO_BINARY);
    await oSignedData.propset_Content(this.getBase64CurrentSigns(signData.fieldValue.ByteRange));
    let certInfo = {} as any;
    let sigInfo = {} as any;
    let cert, sig, valid;
    let signer = signData.signer;
    try {
      cert = await signer.Certificate;
      certInfo.certSubject = await cert.SubjectName;
      certInfo.certNumber = await cert.SerialNumber;
      certInfo.certThumb = await cert.Thumbprint;
      certInfo.certIssuer = await cert.IssuerName;
      certInfo.validFromDate = await cert.ValidFromDate;
      certInfo.validToDate = await cert.ValidToDate;
    } catch (e) {
      console.error(e);
    }
    try {
      sig = await signer.SignatureStatus;
      sigInfo.isValid = await sig.IsValid;
      sigInfo.time = await signer.SigningTime;
      sigInfo.options = await signer.Options;
      sigInfo.signatureType = signData.signType;
      sigInfo.signatureName = signData.fieldName;

    } catch (e) {
      console.error(e);
    }
    let fileData = {
      name: this.filename
    };
    this.dialog.open(SignatureInfoComponent, {
      maxHeight: '60vh',
      width: '60vw',
      data: {
        fileData,
        certInfo,
        sigInfo
      }
    });

    let displayData = await oSignedData.DisplayData;
    console.dir([signData, oSignedData, sigInfo, certInfo, displayData]);

  }

  addSvgColor(svg: SVGElement, valid: boolean, opacity?: { valid: string; invalid: string }) {
    svg.setAttribute('fill', valid
      ? `rgba(37, 174, 136, ${opacity ? opacity.valid : '0.4'})`
      : `rgba(241, 86, 66, ${opacity ? opacity.invalid : '0.4'})`);
    svg.setAttribute('stroke', valid ? `1px solid rgba(37, 174, 136, 0.5)` : `1px solid rgba(241, 86, 66, 0.5)`);
    svg.style.background = valid
      ? `rgba(37, 174, 136, ${opacity ? opacity.valid : '0.4'})`
      : `rgba(241, 86, 66, ${opacity ? opacity.invalid : '0.4'})`;
    svg.style.borderColor = valid ? `rgba(37, 174, 136, 0.5)` : `rgba(241, 86, 66, 0.5)`;
  }

  addValidIcon(rect: number[], svgViewPort: any) {
    //TODO: поправить расположение иконки валидации
    const yc = (rect[1] - rect[3]) / 2 - 12 > 0 ? (rect[1] - rect[3]) / 2 - 12 : 0;
    const viewBoxHeight = (rect[1] - rect[3]) / 2 - 12 > 0 ? (rect[1] - rect[3]) / 2 - 12 : 12;
    const success = this.viewerIframe.contentDocument.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    ) as SVGElement;
    success.setAttribute('x', '' + (rect[2] - rect[0] - 20));
    success.setAttribute('y', '' + yc);
    success.setAttribute('viewBox', `0 0 ${rect[2] - rect[0] - 20} ${viewBoxHeight}`);
    success.setAttribute('xml:space', 'preserve');
    success.setAttribute('data-pdf-annotate-viewport', JSON.stringify(svgViewPort));
    success.style.fill = '#25AE88';

    const circle = this.viewerIframe.contentDocument.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle'
    ) as SVGElement;
    circle.setAttribute('cx', '7');
    circle.setAttribute('cy', '7');
    circle.setAttribute('r', '7');
    circle.setAttribute('data-pdf-annotate-viewport', JSON.stringify(svgViewPort));

    const polyline = this.viewerIframe.contentDocument.createElementNS(
      'http://www.w3.org/2000/svg',
      'polyline'
    ) as SVGElement;
    polyline.setAttribute('points', '10,5 6.5,9.5 3.5,7');
    polyline.setAttribute('data-pdf-annotate-viewport', JSON.stringify(svgViewPort));
    polyline.style.fill = 'none';
    polyline.style.stroke = '#FFFFFF';
    polyline.style.strokeWidth = '1.5';
    polyline.style.strokeLinecap = 'round';
    polyline.style.strokeLinejoin = 'round';
    polyline.style.strokeMiterlimit = '10';

    success.appendChild(circle);
    success.appendChild(polyline);

    return success;
  }

  setOrganizationIcon(icon: string) {
    this.iconOrganization = icon;
  }

  // endregion

  // region Annotations
  subscribeToAnnotations(): void {
    [this.editor.rect, this.editor.stamp, this.editor.pen, this.editor.text, this.editor.line, this.editor.point].forEach(
      (value, index) => {
        value.annotationBehavior.add.pipe(filter(x => x != null)).subscribe((annotation) => {
          this.pushAnnotation(annotation);
        });
      }
    );
    this.editor.edit.annotationBehavior.change.subscribe((annotation) => {
      this.changeAnnotation(annotation);
    });
    this.editor.edit.annotationBehavior.delete.subscribe((annotationId) => {
      this.deleteAnnotation(annotationId);
    });
  }

  unsubscribeAnnotations() {
    if (this.editor) {
      [this.editor.rect, this.editor.stamp, this.editor.pen, this.editor.text, this.editor.line, this.editor.point].forEach(
        (value, index) => {
          value.annotationBehavior.add.unsubscribe();
        }
      );
      this.editor.edit.annotationBehavior.delete.unsubscribe();
    }
  }

  deleteAnnotation(annotationId: any) {
    const annotationIndex = this.editorFiles[this.activeDocumentIndex].annotations.findIndex((ann) => ann.uuid === annotationId);
    if (annotationIndex >= 0) {
      this.editorFiles[this.activeDocumentIndex].annotations.splice(annotationIndex, 1);
    }
  }

  changeAnnotation(annotation: { uuid: any; }) {
    if (!annotation) {
      return;
    }
    const annotationIndex = this.editorFiles[this.activeDocumentIndex].annotations.findIndex((ann) => ann.uuid === annotation.uuid);
    if (annotationIndex >= 0) {
      this.editorFiles[this.activeDocumentIndex].annotations[annotationIndex] = annotation;
    }
  }

  destroyAnnotations() {
    const svgs = Array.from(this.viewerIframe.contentDocument.querySelectorAll('svg.wb-pdf-annotation-layer'));
    for (const svg of svgs) {
      svg.innerHTML = '';
    }
  }

  getDocumentAnnotations() {
    // this.auth.post(environment.apiUrl + 'get=PdfDocAnnotations', {
    //   WBFFileID: this.WBFFileID
    // }).subscribe((answer) => {
    //   if (answer['annotations'] || answer['annotation_comments']) {
    //     this.editorFiles[this.activeDocumentIndex].annotations = answer['annotations'] || [];
    //     this.originalAnnotationsArray = [...answer['annotations']] || [];
    //     this.originalComments = {...answer['annotation_comments']};
    //     for (let id in this.originalComments) {
    //       comments[id] = this.originalComments[id];
    //     }
    //     this.drawAnnotationsArray();
    //   }
    // });
  }

  createAnnotationWorkLayer(pageDom: HTMLElement) {
    const div = this.viewerIframe.contentDocument.createElement('div') as HTMLElement;
    div.style.position = 'absolute';
    div.style.top = '0';
    div.style.left = '0';
    div.style.right = '0';
    div.style.bottom = '0';
    div.style.zIndex = '-1';
    div.classList.add('wb-pdf-annotation-work-layer');
    return div;
  }

  addAnnotationWorkLayerToPage(pageDom: HTMLElement) {
    if (pageDom.querySelectorAll('.wb-pdf-annotation-work-layer').length === 0) {
      const AWL = this.createAnnotationWorkLayer(pageDom);
      pageDom.appendChild(AWL);
    }
  }

  drawAnnotationsArray(pageDom?: HTMLElement | undefined) {
    const neededAnnotation = pageDom
      ? this.editorFiles[this.activeDocumentIndex].annotations.filter((ann) => ann.page == pageDom.getAttribute('data-page-number'))
      : this.editorFiles[this.activeDocumentIndex].annotations;
    const viewer = this.viewerIframe.contentDocument.getElementById('viewer');
    let page = pageDom ? pageDom : null;

    if (neededAnnotation) {
      neededAnnotation.forEach((annotation) => {
        if (!pageDom) {
          page = viewer.querySelector(`.page[data-page-number="${annotation.page}"]`);
        }
        const svg = page.querySelector('svg.wb-pdf-annotation-layer');
        this.editor.rect.appendChild(svg, annotation, null, false);
      });
    }
  }

  prepareAnnotationToFDF(annotation: { page: number; type: string; date: moment.MomentInput; uuid: any; color: any; width: any; rectangles: any[]; start: number[]; end: number[]; }) {
    const newAnnotation = {} as any;
    const pageIndex = annotation.page - 1;
    const getPageView = this.PDFViewerApplication.pdfViewer.getPageView(pageIndex);
    const svgViewPort = getPageView.viewport;
    const viewBox = svgViewPort.viewBox;
    const annotRect = this.rectPdfPosition(annotation, svgViewPort);
    newAnnotation.attr = {
      rect: annotRect.join(','),
      page: pageIndex,
      title: localStorage.getItem('userId'),
      subject: this.getSubject(annotation.type),
      flags: 'print',
      creationdate: moment(annotation.date)
        .format('[D:]YYYYMMDDHHmmssZ')
        .replace(/:\d\d$/, '\'00\''),
      date: moment(annotation.date)
        .format('[D:]YYYYMMDDHHmmssZ')
        .replace(/:\d\d$/, '\'00\''),
      name: annotation.uuid,
      color: this.hashColor(annotation.color) || '#FF0000',
    };
    if (annotation.type == 'textbox') {
      delete newAnnotation.attr.color;
      newAnnotation.attr.width = '0';
    }
    if (annotation.type == 'text') {
      delete newAnnotation.attr.color;
      newAnnotation.attr.width = '0';
      newAnnotation.attr.icon = 'comment';
    }
    if (annotation.type == 'drawing') {
      newAnnotation.attr.width = annotation.width;
    }
    if (annotation.type == 'highlight') {
      newAnnotation.attr.coords = annotation.rectangles
        .map((value: { x: any; y: number; width: any; height: any; }) => {
          return [
            value.x,
            viewBox[3] - value.y,
            value.x + value.width,
            viewBox[3] - value.y,
            value.x,
            viewBox[3] - (value.y + value.height),
            value.x + value.width,
            viewBox[3] - (value.y + value.height),
          ].join(',');
        })
        .join(',');
    }
    if (annotation.type == 'line') {
      newAnnotation.attr.start = [annotation.start[0], viewBox[3] - annotation.start[1]].join(',');
      newAnnotation.attr.end = [annotation.end[0], viewBox[3] - annotation.end[1]].join(',');
      newAnnotation.attr.width = annotation.width;
    }

    const moreInfo = this.appendAnnotationByType(annotation, viewBox);
    newAnnotation.tagName = moreInfo[0];
    newAnnotation.innerTags = moreInfo[1];
    newAnnotation.xml = this.createXMLObject(newAnnotation);
    return newAnnotation;
  }

  getAnnotationComment(annotation: { uuid: string | number; }) {
    const annComments = this._comments[annotation.uuid] || [];

    return annComments.map((comm) => comm.user + ': ' + comm.valueComment).join('\r\n');
  }

  appendAnnotationByType(annotation: { type: any; size: any; color: any; lines: any[]; content: any; }, viewBox?: number[]) {
    const type = annotation.type;
    let tagName, innerTags;
    switch (type) {
      case 'point':
        tagName = 'text';
        innerTags = [
          {
            tagName: 'contents',
            // text: this.getAnnotationComment(annotation),
          },
          {
            tagName: 'defaultappearance',
            text: '16.25 TL /Cour 12 Tf',
          },
          {
            tagName: 'defaultstyle',
            text: `font: Arial ${annotation.size}pt;font-stretch:Normal; text-align:left; color:${this.hashColor(annotation.color) || '#000000'
              } `,
          },
        ];
        break;
      case 'area':
        tagName = 'square';
        innerTags = [
          {
            tagName: 'contents',
            // text:  this.getAnnotationComment(annotation),
          },
        ];
        break;
      case 'signature':
        tagName = 'square';
        innerTags = [
          {
            tagName: 'contents',
            // text:  this.getAnnotationComment(annotation),
          },
        ];
        break;
      case 'line':
        tagName = 'line';
        innerTags = [
          {
            tagName: 'contents',
            // text:  this.getAnnotationComment(annotation),
          },
          {
            tagName: 'popup',
            attr: {
              flags: 'print,nozoom,norotate',
              open: 'no',
              page: '0',
              rect: '842.000000,412.504761,1022.000000,532.504761',
            },
          },
        ];
        break;
      case 'highlight':
        tagName = 'highlight';
        innerTags = [
          {
            tagName: 'contents',
            // text:  this.getAnnotationComment(annotation),
          },
        ];
        break;
      case 'drawing':
        tagName = 'ink';
        innerTags = [
          {
            tagName: 'contents',
            // text: this.getAnnotationComment(annotation),
          },
          {
            tagName: 'inklist',
            innerTags: [
              {
                tagName: 'gesture',
                text: annotation.lines
                  .map((value: any) => {
                    const val = [...value];
                    val[1] = viewBox[3] - val[1];
                    return val.join(',');
                  })
                  .join(';'),
              },
            ],
          },
        ];
        break;
      case 'textbox':
        tagName = 'freetext';
        innerTags = [
          {
            tagName: 'contents',
            text: annotation.content,
          },
          {
            tagName: 'defaultappearance',
            text: '16.25 TL /Cour 12 Tf',
          },
          {
            tagName: 'defaultstyle',
            text: `font: Arial ${annotation.size}pt;font-stretch:Normal; text-align:left; color:${this.hashColor(annotation.color) || '#000000'
              } `,
          },
        ];
        break;
    }
    return [tagName, innerTags];
  }

  getNewAnnotationObjects() {
    let annArr = this.editorFiles[this.activeDocumentIndex].annotations;
    const commArray: any[] = [];
    annArr = annArr.map((value) => {
      const preparedAnn = this.prepareAnnotationToFDF(value);
      commArray.push(...this.createCommentObjects(preparedAnn));
      return preparedAnn;
    });
    annArr.push(...commArray);
    return annArr;
  }

  pushAnnotation(annotation: { docFootprint: any; uuid: any; type: string; valueComment: any; }) {
    if (annotation &&
      (!annotation.docFootprint || annotation.docFootprint == document.getElementsByTagName('iframe')[0].contentWindow['PDFViewerApplication'].documentFingerprint) &&
      !this.editorFiles[this.activeDocumentIndex].annotations.find((x) => x.uuid == annotation.uuid)) {
      if (annotation.type == 'point') {
        delete annotation.valueComment;
      }
      this.editorFiles[this.activeDocumentIndex].annotations.push(annotation);
    }
  }

  // endregion

  downloadContentAsFile(content: ArrayBuffer|Uint8Array|Blob|File|string, filename: string) {
    var file: File;
    switch (typeof content) {
      case 'File': file = content; break;
      case 'ArrayBuffer':
      case 'Uint8Array':
      case 'string':
      default: file = new File([content], filename, {type: 'application/pdf'}); break;
    }
    if (window.navigator['msSaveOrOpenBlob']) {
      window.navigator['msSaveBlob'](file, filename);
    } else {
      var elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(file);
      elem.download = filename;
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
    }
  }

  // endregion

  // region SVG
  addSvgLayerToPage(pageDom: HTMLElement) {
    if (pageDom.querySelectorAll('.wb-pdf-annotation-layer').length === 0) {
      const SVG = this.createSvgLayer(pageDom);
      pageDom.insertBefore(SVG, pageDom.querySelector('.textLayer'));
    }
  }

  createSvgLayer(pageDom: HTMLElement) {
    const pageNumber = +pageDom.getAttribute('data-page-number');
    const pageIndex = pageNumber - 1;
    const svg = this.viewerIframe.contentDocument.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGElement;
    svg.setAttribute('width', '' + pageDom.clientWidth);
    svg.setAttribute('height', '' + pageDom.clientHeight);
    svg.setAttribute('data-pdf-annotate-container', 'true');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.right = '0';
    svg.style.bottom = '0';
    const getPageView = this.PDFViewerApplication.pdfViewer.getPageView(pageIndex);
    const svgViewPort = getPageView.viewport;
    svgViewPort.rotation = (svgViewPort.rotation - getPageView.pdfPageRotate) % 360;
    svg.setAttribute('data-pdf-annotate-viewport', JSON.stringify(svgViewPort));
    svg.setAttribute('data-pdf-annotate-page', pageNumber.toString());
    svg.classList.add('wb-pdf-annotation-layer');
    return svg;
  }

  rectPdfPosition(annotation: { uuid: any; getAttribute: (arg0: string) => string; type: string; x: any; y: any; }, viewport?: { convertToViewportRectangle: (arg0: any[]) => any; scale: number; convertToPdfPoint: (arg0: number, arg1: number) => any; }) {
    const uuid = annotation.uuid || annotation.getAttribute('data-pdf-annotate-id');
    const el = document
      .getElementsByTagName('iframe')[0]
      .contentDocument.querySelector('[data-pdf-annotate-id="' + uuid + '"]') as any;
    let bRect;
    let rect;
    if (viewport && annotation.getAttribute('data-pdf-annotate-type') !== 'signature') {
      bRect = el.getBBox();
      if (annotation.type == 'point') {
        bRect = {
          x: annotation.x,
          y: annotation.y,
          width: 20,
          height: 20,
        };
      }
      rect = viewport.convertToViewportRectangle([bRect.x, bRect.y, bRect.x + bRect.width, bRect.y + bRect.height]);
      [rect[1], rect[3]] = [rect[3], rect[1]];
      rect = rect.map((val: number) => val / viewport.scale);
    } else if (annotation.getAttribute('data-pdf-annotate-type') === 'signature' && viewport) {
      bRect = {
        x: +annotation.getAttribute('x'),
        y: +annotation.getAttribute('y'),
        height: +annotation.getAttribute('height'),
        width: +annotation.getAttribute('width'),
      };
      const firstPair = viewport.convertToPdfPoint(bRect.x, bRect.y);
      const secondPair = viewport.convertToPdfPoint(bRect.x + bRect.width, bRect.y + bRect.height);
      rect = [...firstPair, ...secondPair];
    } else {
      bRect = el.getBoundingClientRect() as any;
    }
    return rect;
  }

  // endregion

  arraysEqual(a: string | any[] | null | undefined, b: string | any[] | null) {
    if (a === b) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  revertChanges() {
    if (this.arraysEqual(this.editorFiles[this.activeDocumentIndex].annotations, this.originalAnnotationsArray)) {
      return;
    }
    this.acceptDialogRef.afterClosed().subscribe((yea: any) => {
      if (yea) {
        this.editorFiles[this.activeDocumentIndex].annotations = [...this.originalAnnotationsArray];
        for (let id in this.originalComments) {
          this._comments[id] = [...this.originalComments[id]];
        }
        this.destroyAnnotations();
        this.drawAnnotationsArray();
      }
    });
  }

  createXMLObject(annotation: { attr: { rect: any; page: any; title: string; subject: string; inreplyto: any; flags: string; creationdate: string; date: string; name: string; }; tagName: string; xml: string; innerTags: { tagName: string; text: string; }[]; }) {
    const xmlDoc = document.implementation.createDocument(null, 'xfdf', null);
    const createObj = (parentObj: { appendChild: (arg0: any) => void; } | null, cfg: any) => {
      const newObj = xmlDoc.createElement(cfg.tagName);
      if (cfg.innerTags) {
        cfg.innerTags.forEach((value: any) => {
          createObj(newObj, value);
        });
      }
      if (cfg.attr) {
        for (let key in cfg.attr) {
          newObj.setAttribute(key, cfg.attr[key]);
        }
      }
      if (cfg.text) {
        newObj.textContent = cfg.text;
      }
      if (parentObj) {
        parentObj.appendChild(newObj);
      } else {
        return newObj;
      }
    };

    return createObj(null, annotation);
  }

  addCustomHtml() {
    const frameDoc = document.getElementsByTagName('iframe')[0].contentDocument;
    const actionMenu = document.createElement('div') as HTMLElement;
    actionMenu.style.width = '32px';
    actionMenu.style.height = '25px';
    actionMenu.style.background = '#258720';
    actionMenu.style.display = 'inline-block';
    actionMenu.style.textAlign = 'center';
    actionMenu.style.lineHeight = '25px';
    actionMenu.style.borderRadius = '2px';
    actionMenu.style.transition = '0.3s';
    actionMenu.style.cssFloat = 'left';
    actionMenu.style.margin = '2px 28px 0 4px';
    actionMenu.style.border = '1px solid #1c3f1a';
    const svgMenu = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGElement;
    svgMenu.style.width = '16px';
    svgMenu.style.height = '12px';

    const useMenu = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    const attr = document.createAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href');
    attr.value = '/assets/imgs/icons_instruments_editor/editor_annotates/svg_icons.svg#menu';
    useMenu.setAttributeNode(attr);
    svgMenu.appendChild(useMenu);
    actionMenu.appendChild(svgMenu);
    frameDoc
      .getElementById('toolbarViewer')
      .insertBefore(actionMenu, frameDoc.getElementById('toolbarViewer').children[0]);
  }

  outXML(annArr: any[]) {
    let xmlText =
      '<?xml version="1.0" encoding="UTF-8"?>' + '<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">';
    const xmlDoc = document.implementation.createDocument(null, 'xfdf', null);
    const annots = xmlDoc.createElement('annots');
    annArr.forEach((value: { xml: any; }) => {
      annots.appendChild(value.xml);
    });
    xmlText += new XMLSerializer().serializeToString(annots);
    xmlText.replace('</', '\r\n</');
    xmlText += '</xfdf>';
    return new Blob([xmlText]);
  }

  createCommentObjects(newAnnotations: { attr: { name: any; rect: any; page: any; }; }) {
    let thisComments = [];
    const preparedComments: { attr: { rect: any; page: any; title: string; subject: string; inreplyto: any; flags: string; creationdate: string; date: string; name: string; }; tagName: string; xml: string; innerTags: { tagName: string; text: string; }[]; }[] = [];
    const uuid = newAnnotations.attr.name;
    if (uuid) {
      thisComments = this.editor.edit.comments[uuid];
      if (thisComments && thisComments.length) {
        thisComments.forEach((comment) => {
          const comm = {
            attr: {
              rect: newAnnotations.attr.rect,
              page: newAnnotations.attr.page,
              title: comment['user'],
              subject: 'комментарий',
              inreplyto: uuid,
              flags: 'print, nozoom',
              creationdate: moment(comment['date']).format('[D:]YYYYMMDDHHmmss[+03\'00\']'),
              date: moment(comment['date']).format('[D:]YYYYMMDDHHmmss[+03\'00\']'),
              name: comment['name'],
            },
            tagName: 'text',
            xml: '',
            innerTags: [
              {
                tagName: 'contents',
                text: comment.valueComment,
              },
              {
                tagName: 'defaultappearance',
                text: '16.25 TL /Cour 12 Tf',
              },
              {
                tagName: 'defaultstyle',
                text: `font: Arial 12pt;font-stretch:Normal; text-align:left; color: '#000000'} `,
              },
            ],
          };
          comm.xml = this.createXMLObject(comm);
          preparedComments.push(comm);
        });
      }
    }
    return preparedComments;
  }

  chosePdf() {
    this.pdfFileInput.click();
  }
}
