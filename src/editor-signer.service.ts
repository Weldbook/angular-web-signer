// @ts-nocheck
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, map, from } from 'rxjs';
import { getUserCertificates, Certificate } from 'crypto-pro';
import moment from 'moment';
import { WBD_EDITOR_CONFIG } from './editor-tokens';
import { CadesHelper, arrayBufferToBase64 } from './signer/cades.helper';
import { PdfSignatureHelper } from './signer/pdf-signature.helper';
import { DataFileForSign, ExtendedCertificate, SignatureObject } from './signer/models';

@Injectable()
export class EditorSignerService {
  signerServiceUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(WBD_EDITOR_CONFIG) config: { signerServiceUrl?: string; apiUrl?: string }
  ) {
    this.signerServiceUrl = config?.signerServiceUrl || '';
  }

  getCertificates(): Observable<ExtendedCertificate[]> {
    const regex = /[a-zA-Z]/;
    return from(getUserCertificates()).pipe(
      map((certs) =>
        certs.map((x) => {
          x['subjectData'] = x.subjectName
            .split(',')
            .map((item) => item.split('=').map((x) => x.trim()))
            .reduce((o, key) => ({ ...o, [key[0]]: key[1] }), {});
          x.validTo = regex.test(x.validTo) ? moment(x.validTo).format('DD-MM-YYYY') : x.validTo;
          x.validFrom = regex.test(x.validFrom) ? moment(x.validFrom).format('DD-MM-YYYY') : x.validFrom;
          x.isValid().then((res) => (x['isValidCertificate'] = res));
          x._cadesCertificate.SerialNumber.then((res) => (x['certificateNumber'] = res));
          return x;
        })
      )
    );
  }

  generateHash(base64Data: string, certificate: Certificate) {
    return CadesHelper.generateHash(base64Data, certificate);
  }

  signHash(hash: string, certificate: Certificate, licenses = null, basedSignature = null): Promise<string> {
    return CadesHelper.signHash(hash, certificate, licenses, basedSignature);
  }

  placeVisibleSignature(documentContent: ArrayBuffer, currentSign: SignatureObject, certificateObj: Certificate) {
    return PdfSignatureHelper.placeVisibleSignature(documentContent, currentSign, certificateObj);
  }

  async createSign(
    documentContent: ArrayBuffer,
    certificateObj: Certificate,
    currentSign: SignatureObject,
    oldSignature?: string = null,
    visualSignedDocument?: ArrayBuffer = null
  ) {
    let licenses = await CadesHelper.checkLicense();
    const certificateThumbprint = certificateObj.thumbprint;
    let certificate = await CadesHelper.getCertificateByThumb(certificateThumbprint);
    if (!currentSign || !documentContent) {
      return false;
    }
    try {
      if (documentContent && certificateObj) {
        const certificateDetails = certificateObj.subjectName
          .split(',')
          .map((item) => item.split('=').map((x) => x.trim()))
          .reduce((o, key) => ({ ...o, [key[0]]: key[1] }), {});
        console.log(certificateObj._cadesCertificate, 'объект данных сертификата');
        let signatureName;

        if (currentSign.fieldName) {
          signatureName = currentSign.fieldName;
        }
        let documentVisualSigContent = await PdfSignatureHelper.placeVisibleSignature(
          visualSignedDocument || documentContent,
          currentSign,
          certificateObj
        );
        console.log('VisualSignedFile obtained');

        // END of placing image

        const b64encoded = arrayBufferToBase64(documentContent);
        let hash = await CadesHelper.generateHash(b64encoded, certificate);
        let signatureContent = await CadesHelper.signHash(hash, certificate, licenses, oldSignature);
        if (!signatureContent) {
          return false;
        }

        console.log('signatureContent created');

        return {
          documentContent,
          signatureContent,
          documentVisualSigContent,
        };
      }
    } catch (error) {
      console.error(error);
    }
    return false;
  }

  sendFileForSign(data: DataFileForSign): Observable<any> {
    const formData = new FormData();
    formData.append('userFile', data.file, data.fileName);
    formData.append('rect', data.rect.join('|'));
    formData.append('page', data.page);
    formData.append('certificateNumber', data.certificateNumber);
    formData.append('certificateValidFrom', data.certificateValidFrom);
    formData.append('certificateValidTo', data.certificateValidTo);
    formData.append('signerData', data.signerData);
    if (data.signatureName) {
      formData.append('signName', data.signatureName);
    }
    return this.http.post(this.signerServiceUrl + '/signer/placeImageSignature', formData);
  }
}

export { DataFileForSign, SignatureObject } from './signer/models';
