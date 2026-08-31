# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Demo application under `demo/` with an in-memory file-management service and
  a self-contained annotation engine.
- Runtime assets (toolbar icons and `cadesplugin_api.js`) are now shipped in
  the published package via `ng-package.json` `assets`.

### Changed

- Refactored `EditorSignerService` into focused helpers:
  `src/signer/models.ts`, `src/signer/cades.helper.ts` and
  `src/signer/pdf-signature.helper.ts`. The public API
  (`getCertificates`, `createSign`, `generateHash`, `signHash`,
  `placeVisibleSignature`, `sendFileForSign` and the
  `DataFileForSign` / `SignatureObject` models) is unchanged.
- Removed the `WbFileMngService` / `WBD_FILE_MNG_SERVICE` injection token and
  the `wbfFileId`/`filemng` concepts. Files are fetched from `{apiUrl}/{fileId}`.
- Dropped the unused `lodash-es` dependency from the library peer/dev
  dependencies and from the demo.

### Removed

- Orphaned 11 MB `src/assets/pdfjs/` vendor dump (PDF.js is served from
  `ng2-pdfjs-viewer`).
- Dead code from the editor components: unused `link` input, empty lifecycle
  hooks and the unused `toDataURL` helper.

### Fixed

- Removed a leftover `debugger` statement from the annotation toolbar.
- `mat-slider` now uses the Angular Material 18 API (`matSliderThumb` +
  `valueChange`), eliminating the `NG01203` "no value accessor" and "invalid
  slider thumb input configuration" runtime errors previously reported in the
  demo.
