/**
 * Supported CAdES signature formats.
 */
export type SignatureType = 'CADES_BES' | 'CADES_T';

/**
 * User-configurable signing options.
 * Stored in `localStorage` and applied when a document is signed.
 */
export interface SignerSettings {
  /** CAdES signature format to produce (CADES_BES or CADES_T). */
  signatureType: SignatureType;
  /** Time Stamping Protocol server URL (used for CADES_T). */
  tspUrl: string;
  /** OCSP server URL (revocation checks). */
  ocspUrl: string;
}

export const SIGNER_SETTINGS_DEFAULTS: SignerSettings = {
  signatureType: 'CADES_T',
  tspUrl: 'http://qs.cryptopro.ru/tsp/tsp.srf',
  ocspUrl: 'http://qs.cryptopro.ru/ocsp/ocsp.srf',
};
