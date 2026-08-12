'use strict';

/**
 * Stub for the `crypto-pro` package.
 *
 * The real package communicates with the CryptoPro CAdES browser plugin
 * (Windows only). This stub lets the @wbd/editor demo build and run on any
 * platform. In the browser it returns an empty certificate list, so the
 * "sign" panel simply shows no certificates.
 */

async function getUserCertificates() {
  if (typeof window !== 'undefined' && window['cadesplugin']) {
    console.warn(
      '[demo/crypto-pro] CAdES plugin detected, but the demo stub does not ' +
        'implement real signing. Install the real `crypto-pro` package to sign.'
    );
  }
  return [];
}

module.exports = {
  getUserCertificates,
  default: { getUserCertificates },
};
