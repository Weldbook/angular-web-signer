import {
  CustomFontEmbedder,
  PDFDict,
  PDFDocument,
  PDFFont,
  PDFName,
  PDFRawStream,
  decodePDFRawStream,
  rgb,
  RGB,
  PDFArray,
  PDFRef
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Certificate } from 'crypto-pro';
import { ExtendedCertificate, SignatureObject } from './models';

/**
 * Helpers for placing a visible signature stamp on a PDF using pdf-lib.
 * All methods are stateless.
 */
export class PdfSignatureHelper {
  static getEmbededFontFromPdf(fontname: string, pdfDoc: PDFDocument) {
    let arr = pdfDoc.context.enumerateIndirectObjects();
    let fontRefArray = arr.find(
      ([ref, obj]) =>
        obj instanceof PDFDict &&
        obj.get(PDFName.of('BaseFont'))?.toString() === `/${fontname}` &&
        obj.get(PDFName.Type)?.toString() === `/Font`
    );
    if (!fontRefArray) {
      return fetch(`assets/fonts/${fontname}.ttf`)
        .then((res) => res.arrayBuffer())
        .then((arratBuffer) => pdfDoc.embedFont(arratBuffer, {customName: fontname}));
    }
    let fontRef = fontRefArray[0];
    // First retrieve and decode the embedded font bytes. These are located in FontDict[DescendantFonts][0][FontDescriptor][FontFile2].
    const fontDict = pdfDoc.context.lookup(fontRef, PDFDict);
    const fontCID = pdfDoc.context.lookup(
      (fontDict.get(PDFName.of('DescendantFonts')) as PDFArray).get(0) as PDFRef,
      PDFDict
    );
    const fontDescr = pdfDoc.context.lookup(fontCID.get(PDFName.of('FontDescriptor')) as PDFRef, PDFDict);
    const fontFileStream = pdfDoc.context.lookup(fontDescr.get(PDFName.of('FontFile2')) as PDFRef) as PDFRawStream;
    const fontBytes = decodePDFRawStream(fontFileStream).decode();
    // Now create a PDFFont object directly from the font bytes, such that it is not reembedded.
    if (fontBytes) {
      return CustomFontEmbedder.for(fontkit, fontBytes).then((embedder) => PDFFont.of(fontRef, pdfDoc, embedder));
    } else {
      return fetch(`assets/fonts/${fontname}.ttf`)
        .then((res) => res.arrayBuffer())
        .then((arratBuffer) => pdfDoc.embedFont(arratBuffer, {customName: fontname}));
    }
  }

  static async placeVisibleSignature(documentContent: ArrayBuffer, currentSign: SignatureObject, certificateObj: ExtendedCertificate) {
    let pdfDoc = await PDFDocument.load(documentContent);
    let page = pdfDoc.getPage(currentSign.page - 1);

    // Define the properties of the rounded rectangle
    const rect = {
      x: Math.min(currentSign.rect[2], currentSign.rect[0]),
      y: Math.min(currentSign.rect[3], currentSign.rect[1]),
      width: Math.abs(currentSign.rect[2] - currentSign.rect[0]),
      height: Math.abs(currentSign.rect[3] - currentSign.rect[1]),
    }; // Adjust as needed

    const thickness = Math.ceil(rect.height / 80);
    const radius = Math.ceil(rect.height / 5);

    let colorPalette = {
      backgroundColor: rgb(1, 1, 1),
      textColor1: rgb(0.13, 0.13, 0.13),
      textColor2: rgb(0.8, 0.8, 0.8),
      textColor3: rgb(0.6, 0.6, 0.6),
      borderColor: rgb(0.2, 0.2, 0.2),
      filled: rgb(0.33, 0.33, 0.33),
    };

    pdfDoc.registerFontkit(fontkit);
    let fonts = {
      regular: await PdfSignatureHelper.getEmbededFontFromPdf('Roboto-Regular', pdfDoc),
      bold: await PdfSignatureHelper.getEmbededFontFromPdf('Roboto-Bold', pdfDoc),
    };

    let fontSize = Math.min(Math.round(radius / 1.5), Math.round(rect.width / 40));
    let lineSize = fontSize * 1.55;

    let titleSize = fontSize * 1.5;
    let titleLineSize = titleSize * 1.3;

    let iconScale = rect.height / 3 / 150;

    let offsets = {
      leftColumn: {
        x: radius,
        y: rect.height / 2 - fontSize / 2,
      },
      title: {
        x: Math.max(rect.width / 4, iconScale * 280),
        y: rect.height - radius * 1.2,
      },
      rightColumn: {
        x: Math.max(rect.width / 4, iconScale * 280),
        y: rect.height / 2 - fontSize / 2,
      },
    };


    let icon =
      'M13.72,27.69,3.29,17.27a1,1,0,0,1,1.41-1.41l9,9L31.29,7.29a1,1,0,0,1,1.41,1.41Z';
    let roundedRect = `M${radius},0 h${rect.width - radius * 2} a${radius},${radius} 0 0 1 ${radius},${radius} v${rect.height - radius * 2} a${radius},${radius} 0 0 1 -${radius},${radius} h-${rect.width - radius * 2} a${radius},${radius} 0 0 1 -${radius},-${radius} v-${rect.height - radius * 2} a${radius},${radius} 0 0 1 ${radius},-${radius} z`;

    page.drawSvgPath(roundedRect, {
      x: rect.x,
      y: rect.y + rect.height,
      color: colorPalette['backgroundColor'],
      borderColor: colorPalette['borderColor'],
      borderWidth: thickness,
    });
    page.drawSvgPath(icon, {
      x: rect.x + radius * 1.2,
      y: rect.y + rect.height - radius * 0.6,
      scale: iconScale * 4,
      color: colorPalette['filled'],
    });

    // texts
    page.drawText('Сертификат:', {
      x: rect.x + offsets.leftColumn.x,
      y: rect.y + offsets.leftColumn.y,
      color: colorPalette['textColor3'],
      font: fonts['regular'],
      size: fontSize,
    });
    page.drawText('Владелец:', {
      x: rect.x + offsets.leftColumn.x,
      y: rect.y + offsets.leftColumn.y - (rect.height / 2 - radius) / 3,
      color: colorPalette['textColor3'],
      font: fonts['regular'],
      size: fontSize,
    });
    page.drawText('Действителен:', {
      x: rect.x + offsets.leftColumn.x,
      y: rect.y + offsets.leftColumn.y - ((rect.height / 2 - radius) / 3) * 2,
      color: colorPalette['textColor3'],
      font: fonts['regular'],
      size: fontSize,
    });

    page.drawText('ДОКУМЕНТ ПОДПИСАН', {
      x: rect.x + +offsets.title.x,
      y: rect.y + offsets.title.y,
      color: colorPalette['textColor1'],
      font: fonts['bold'],
      size: titleSize,
    });
    page.drawText('ЭЛЕКТРОННОЙ ПОДПИСЬЮ', {
      x: rect.x + +offsets.title.x,
      y: rect.y + offsets.title.y - titleLineSize,
      color: colorPalette['textColor1'],
      font: fonts['bold'],
      size: titleSize,
    });
    page.drawText(certificateObj.certificateNumber, {
      x: rect.x + offsets.rightColumn.x,
      y: rect.y + offsets.leftColumn.y,
      color: colorPalette['textColor1'],
      font: fonts['bold'],
      size: fontSize,
    });
    page.drawText(certificateObj?.subjectData?.CN, {
      x: rect.x + offsets.rightColumn.x,
      y: rect.y + offsets.leftColumn.y - (rect.height / 2 - radius) / 3,
      color: colorPalette['textColor1'],
      font: fonts['bold'],
      size: fontSize,
    });
    page.drawText(
      'от ' + certificateObj?.validFrom?.replaceAll('-', '.') + ' до ' + certificateObj?.validTo?.replaceAll('-', '.'),
      {
        x: rect.x + offsets.rightColumn.x,
        y: rect.y + offsets.leftColumn.y - ((rect.height / 2 - radius) / 3) * 2,
        color: colorPalette['textColor1'],
        font: fonts['bold'],
        size: fontSize,
      }
    );

    let outputBytes = await pdfDoc.save();
    return outputBytes;
  }
}
