# @wbd/editor

> Angular PDF editor library with annotation and digital signature (CAdES) support.

[![npm version](https://img.shields.io/npm/v/@wbd/editor)](https://www.npmjs.com/package/@wbd/editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-18-red)](https://angular.dev)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

`@wbd/editor` renders PDF documents in an embedded [PDF.js](https://mozilla.github.io/pdf.js/)
viewer and provides a complete annotation toolbar plus a digital-signature
pipeline built on top of [CryptoPro](https://cryptopro.ru/) (CAdES).

## Features

- **PDF rendering** — full-page viewer powered by `ng2-pdfjs-viewer` / PDF.js.
- **Annotation tools** — pen, highlight, text, rectangle, line, comment and
  signature / stamp placeholders, rendered as SVG overlays that stay aligned
  when the document is zoomed.
- **Annotation interaction** — cursor tool for moving annotations, double-click
  to delete, per-tool color and size controls.
- **Digital signatures (CAdES)** — certificate listing, detached signature
  creation, GOST hash algorithms, timestamping (TSP), signature verification
  and visual signature placement on the PDF.
- **Customizable** — every integration point (file fetching, annotations engine,
  snackbar, download, configuration) is exposed through injection tokens.
- **Angular Material UI** — the toolbar and dialogs are built with Angular
  Material components.

## Live demo

A complete demo application lives in the [`demo/`](demo/) directory. It wires
up the library with an in-memory file-management backend and a self-contained
annotation engine, so you can try every tool without a server.

```bash
# from the repository root
npm install
npm run build          # build the library into ./dist

npm run demo:install   # cd demo && npm install
npm run demo:serve     # cd demo && npm run serve
```

Then open <http://localhost:4200> and click **Open sample.pdf**.
