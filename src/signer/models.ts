import { Certificate } from "crypto-pro";

export interface DataFileForSign {
  rect: number[];
  signatureName?: string;
  page: any;
  signerData: string;
  fileName: string;
  file: Blob;
  certificateNumber: string;
  certificateValidFrom: string;
  certificateValidTo: string;
}

export interface ExtendedCertificate extends Certificate {
  subjectData: any;
  certificateNumber: string;
  certificateValidFrom: string;
  certificateValidTo: string;
}

export interface SignatureObject {
  fieldName: any;
  rect: any;
  page: any;
  hasOwnProperty: (arg0: string) => any;
}
