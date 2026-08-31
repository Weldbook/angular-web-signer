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

export interface Licenses {
  tsp: {
    validTo: string,
    serialNumber: null,
    firstInstall: string,
    licType: string,
    companyName: string,
  },
  ocsp: {
    validTo: string,
    serialNumber: string,
    firstInstall: string,
    licType: string,
    companyName: string,
  },
  csp: {
    validTo: string,
    serialNumber: string,
    firstInstall: string,
    licType: string,
    companyName: string,
  },
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
