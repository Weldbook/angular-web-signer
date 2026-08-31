import { ExtendedCertificate, SignatureObject } from './models';

/**
 * Interface for placing a visible signature stamp on a PDF.
 * Provide your own implementation via the `WBD_VISIBLE_SIGNATURE_PLACER` token.
 */
export interface VisibleSignaturePlacer {
  /**
   * Draws the visible signature into the given PDF content.
   *
   * @param documentContent - raw PDF bytes
   * @param currentSign - signature anchor (page + rect)
   * @param certificate - certificate data used for the stamp content
   * @returns raw bytes of the signed PDF
   */
  placeVisibleSignature(
    documentContent: ArrayBuffer,
    currentSign: SignatureObject,
    certificate: ExtendedCertificate
  ): Promise<Uint8Array>;
}
