# @wbd/editor — Demo

An Angular application that demonstrates the **@wbd/editor** library (Angular
PDF editor with annotation tools and CAdES digital-signature support).

![Angular](https://img.shields.io/badge/Angular-18-red) ![PDF.js](https://img.shields.io/badge/PDF.js-5-green)

## What it shows

- The `<wbd-editor>` component rendering a PDF inside a PDF.js viewer.
- The full annotation toolbar: pen / highlight / rectangle / line / text /
  comment / signature & stamp placeholders.
- The **cursor** tool to move annotations; **double-click** to delete one.
- Opening your **own PDF** (local file or `assets/sample.pdf`).
- The library extension points provided by the demo:

| Token / API                 | Provided by (demo)                     |
|-----------------------------|----------------------------------------|
| `WBD_EDITOR_ANNOTATES`      | `EditorAnnotates` (library annotation engine) |
| `WBD_EDITOR_CONFIG`         | `WbdEditorModule.forRoot({ ... })`     |
| `WBD_DOWNLOAD`              | browser download helper                |
| `crypto-pro`                | `stubs/crypto-pro` (no CAdES plugin)   |

## Running

```bash
# from the repository root, build the library first (produces ./dist)
npm install
npm run build

# then run the demo
npm run demo:install   # cd demo && npm install
npm run demo:serve     # cd demo && npm run serve
```

Open <http://localhost:4200>, click **Open sample.pdf**, and draw on the page.

## Notes

- The demo consumes the library from the local build via
  `"@wbd/editor": "file:../dist"`.
- `crypto-pro` is the CAdES plugin package used for real e-signatures. It is
  Windows-only and requires the CryptoPro CSP browser extension, so the demo
  ships a small stub that makes the app build and run on any platform. The
  "sign" panel will simply list no certificates.
- The annotation engine is the library's own `EditorAnnotates` class, provided
  through the `WBD_EDITOR_ANNOTATES` token. It implements the `pdf-annotate.js`-style
  API the editor component expects; replace it with your own engine in a real
  application by providing a different class for the same token.
