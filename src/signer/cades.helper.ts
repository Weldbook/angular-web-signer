// @ts-nocheck
import { Certificate } from 'crypto-pro';

/**
 * Low-level helpers for working with the CryptoPro `cadesplugin` browser
 * extension (CAdES hashing, signing, certificate lookup and license checks).
 * All methods are stateless and operate on the global `window['cadesplugin']`.
 */
export class CadesHelper {
  static getSignatureAlgorithm(algorithmValue): { name: string; prop: any } {
    const cadesplugin = window['cadesplugin'];
    switch (algorithmValue) {
      case '1.2.643.7.1.1.1.1':
        return { name: '2012256', prop: cadesplugin.CADESCOM_HASH_ALGORITHM_CP_GOST_3411_2012_256 };
      case '1.2.643.7.1.1.1.2':
        return { name: '2012512', prop: cadesplugin.CADESCOM_HASH_ALGORITHM_CP_GOST_3411_2012_512 };
      case '1.2.643.2.2.19':
        return { name: '3411', prop: cadesplugin.CADESCOM_HASH_ALGORITHM_CP_GOST_3411 };
      default:
        throw new Error('Реализуемый алгоритм не подходит для подписания документа.');
    }
  }

  static generateHash(base64Data: string, certificate: Certificate) {
    const cadesplugin = window['cadesplugin'];
    const getSignatureAlgorithm = CadesHelper.getSignatureAlgorithm;
    return new Promise(function (resolve, reject) {
      cadesplugin.async_spawn(
        function* (args: any) {
          let certPublicKey = yield certificate.PublicKey();
          let certAlgorithm = yield certPublicKey.Algorithm;
          let algorithmValue = yield certAlgorithm.Value;
          let hashAlgorithm;

          var oHashedData = yield cadesplugin.CreateObjectAsync('CAdESCOM.HashedData');

          //определяем алгоритм подписания по данным из сертификата и получаем алгоритм хеширования
          try {
            let algoData = getSignatureAlgorithm(algorithmValue);
            yield oHashedData.propset_Algorithm(algoData.prop);
            hashAlgorithm = algoData.name;
          } catch (error: Error) {
            alert(error.message);
            return;
          }

          // Указываем кодировку данных
          // Кодировка должна быть указана до того, как будут переданы сами данные
          yield oHashedData.propset_DataEncoding(cadesplugin.CADESCOM_BASE64_TO_BINARY);

          // Предварительно закодированные в BASE64 бинарные данные

          // Передаем данные
          yield oHashedData.Hash(base64Data);

          // Получаем хэш-значение
          var sHashValue = yield oHashedData.Value;

          resolve(sHashValue);
        },
        resolve,
        reject
      );
    });
  }

  static signHash(hash: string, certificate: Certificate, licenses = null, basedSignature = null): Promise<string> {
    const cadesplugin = window['cadesplugin'];
    const getSignatureAlgorithm = CadesHelper.getSignatureAlgorithm;
    return new Promise(function (resolve, reject) {
      cadesplugin.async_spawn(
        function* (args: any) {
          var oCertificate = certificate;
          let certPublicKey = yield certificate.PublicKey();
          let certAlgorithm = yield certPublicKey.Algorithm;
          let algorithmValue = yield certAlgorithm.Value;
          let hashAlgorithm;

          // Создаем объект CAdESCOM.HashedData
          var oHashedData = yield cadesplugin.CreateObjectAsync('CAdESCOM.HashedData');

          //определяем алгоритм подписания по данным из сертификата и получаем алгоритм хеширования
          try {
            let algoData = getSignatureAlgorithm(algorithmValue);
            yield oHashedData.propset_Algorithm(algoData.prop);
            hashAlgorithm = algoData.name;
          } catch (error: Error) {
            alert(error.message);
            return;
          }

          // Инициализируем объект заранее вычисленным хэш-значением
          // Алгоритм хэширования нужно указать до того, как будет передано хэш-значение
          yield oHashedData.SetHashValue(hash);

          // Создаем подписанное сообщение
          // Такая подпись должна проверяться в КриптоАРМ и cryptcp.exe
          // Создаем объект CAdESCOM.CPSigner
          var oSigner = yield cadesplugin.CreateObjectAsync('CAdESCOM.CPSigner');
          yield oSigner.propset_Certificate(oCertificate);
          yield oSigner.propset_CheckCertificate(true);

          let cadesType = cadesplugin.CADESCOM_CADES_BES;
          let tspServers = [
            { name: '', url: 'http://qs.cryptopro.ru/tsp/tsp.srf', description: 'УЦ ООО "КРИПТО-ПРО"' },
            { name: '', url: 'http://tsp.ncarf.ru/tsp/tsp.srf', description: 'Национальный Удостоверяющий центр' },
            { name: '', url: 'http://tsp.taxcom.ru/tsp/tsp.srf', description: 'Такском' },
            { name: '', url: 'http://tax4.tensor.ru/tsp-tensor_gost2012/tsp.srf', description: 'Тензор' },
            { name: '', url: 'http://service.itk23.ru/tsp/tsp.srf', description: 'УЦ ИТК' },
            { name: '', url: 'http://ocsp.ntssoft.ru/tsp/tsp.srf', description: 'НТСсофт' },
            { name: '', url: 'http://pki.sertum-pro.ru/tsp2012/tsp.srf', description: 'Контур (Сертум-Про)' },
          ];
          // if (licenses?.tsp) {
          // let curDate = new Date().getTime();
          // let validTo = new Date(...licenses.tsp.validTo.split('.').reverse()).getTime();
          // if (1 /* Forced tsp to be true. Need testing for unlimited license */) {
              cadesType = cadesplugin.CADESCOM_CADES_X_LONG_TYPE_1;
              yield oSigner.propset_CheckCertificate(true);
              yield oSigner.propset_TSAAddress(tspServers[0].url); // TODO: добавить стратегию выбора
            // }
          // }

          // Создаем объект CAdESCOM.CadesSignedData
          var oSignedData = yield cadesplugin.CreateObjectAsync('CAdESCOM.CadesSignedData');
          if (basedSignature) {
            var newHashedData = yield cadesplugin.CreateObjectAsync('CAdESCOM.HashedData');
            yield oSignedData.VerifyHash(oHashedData, basedSignature, cadesType);
          }

          var sSignedMessage = '';

          // Вычисляем значение подписи
          try {
            if (basedSignature) {
              sSignedMessage = yield oSignedData.CoSignHash(oHashedData, oSigner, cadesType);
            } else {
              sSignedMessage = yield oSignedData.SignHash(oHashedData, oSigner, cadesType);
            }
            resolve(sSignedMessage);
          } catch (err) {
            alert('Failed to create signature. Error: ' + cadesplugin.getLastError(err));
            reject(err);
            return;
          }
        },
        resolve,
        reject
      );
    });
  }

  static getCertificateByThumb(thumbprint: string) {
    const cadesplugin = window['cadesplugin'];
    return new Promise(function (resolve, reject) {
      cadesplugin.async_spawn(
        function* (args: any) {
          let cadesStore;
          try {
            cadesStore = yield cadesplugin.CreateObjectAsync('CAdESCOM.Store');
          } catch (error) {
            console.error(error);
          }

          if (!cadesStore) {
            throw new Error('Не удалось получить доступ к хранилищу сертификатов');
          }

          try {
            cadesStore.Open(
              cadesplugin.CAPICOM_CURRENT_USER_STORE,
              cadesplugin.CAPICOM_MY_STORE,
              cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED
            );
          } catch (error) {
            console.error(error);
          }

          let cadesCertificateList;
          let certificatesCount;

          try {
            cadesCertificateList = yield cadesStore.Certificates;
            certificatesCount = yield cadesCertificateList.Count;
          } catch (error) {
            console.error(error);
          }

          if (!certificatesCount) {
            throw new Error('Нет доступных сертификатов');
          }

          let cadesCertificate;

          try {
            cadesCertificateList = yield cadesCertificateList.Find(
              cadesplugin.CAPICOM_CERTIFICATE_FIND_SHA1_HASH,
              thumbprint
            );
            const count = yield cadesCertificateList.Count;
            if (!count) {
              throw new Error(`Сертификат с отпечатком: "${thumbprint}" не найден`);
            }
            cadesCertificate = yield cadesCertificateList.Item(1);
          } catch (error) {
            console.error(error);
            alert(cadesplugin.getLastError(error));
          }

          cadesStore.Close();
          resolve(cadesCertificate);
        },
        resolve,
        reject
      );
    });
  }

  static checkLicense() {
    const cadesplugin = window['cadesplugin'];
    let licenses = {
      tsp: {
        validTo: null,
        serialNumber: null,
        firstInstall: null,
        licType: null,
        companyName: null,
      },
      ocsp: {
        validTo: null,
        serialNumber: null,
        firstInstall: null,
        licType: null,
        companyName: null,
      },
      csp: {
        validTo: null,
        serialNumber: null,
        firstInstall: null,
        licType: null,
        companyName: null,
      },
    };
    return new Promise(function (resolve, reject) {
      cadesplugin.async_spawn(
        function* (args: any) {
          try {
            var oLicense = yield cadesplugin.CreateObjectAsync('CAdESCOM.CPLicense');

            // Лицензия CSP
            licenses.csp.validTo = yield oLicense.ValidTo();
            licenses.csp.serialNumber = yield oLicense.SerialNumber();
            licenses.csp.firstInstall = yield oLicense.FirstInstallDate();
            licenses.csp.licType = yield oLicense.Type();
            licenses.csp.companyName = yield oLicense.CompanyName(cadesplugin.CADESCOM_PRODUCT_CSP);

            // Лицензия OCSP
            licenses.ocsp.validTo = yield oLicense.ValidTo(cadesplugin.CADESCOM_PRODUCT_OCSP);
            licenses.ocsp.serialNumber = yield oLicense.SerialNumber(cadesplugin.CADESCOM_PRODUCT_OCSP);
            licenses.ocsp.firstInstall = yield oLicense.FirstInstallDate(cadesplugin.CADESCOM_PRODUCT_OCSP);
            licenses.ocsp.licType = yield oLicense.Type(cadesplugin.CADESCOM_PRODUCT_OCSP);
            licenses.ocsp.companyName = yield oLicense.CompanyName(cadesplugin.CADESCOM_PRODUCT_OCSP);

            // Лицензия TSP
            licenses.tsp.validTo = yield oLicense.ValidTo(cadesplugin.CADESCOM_PRODUCT_TSP);
            licenses.tsp.serialNumber = yield oLicense.SerialNumber(cadesplugin.CADESCOM_PRODUCT_TSP);
            licenses.tsp.firstInstall = yield oLicense.FirstInstallDate(cadesplugin.CADESCOM_PRODUCT_TSP);
            licenses.tsp.licType = yield oLicense.Type(cadesplugin.CADESCOM_PRODUCT_TSP);
            licenses.tsp.companyName = yield oLicense.CompanyName(cadesplugin.CADESCOM_PRODUCT_TSP);
          } catch (err) {
            alert(cadesplugin.getLastError(err));
          }
          resolve(licenses);
        },
        resolve,
        reject
      );
    });
  }
}

/** Encodes binary data as a BASE64 string (used to prepare content for hashing). */
export function arrayBufferToBase64(buffer: ArrayBuffer | Iterable<number>) {
  let binary = '';
  let bytes = new Uint8Array(buffer);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
