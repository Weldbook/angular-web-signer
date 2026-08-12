# Contributing to @wbd/editor

First off, thanks for taking the time to contribute! ❤️

This project and everyone participating in it is governed by the
[Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to
uphold this code.

## Table of contents

- [How can I contribute?](#how-can-i-contribute)
  - [Reporting bugs](#reporting-bugs)
  - [Suggesting enhancements](#suggesting-enhancements)
  - [Your first code contribution](#your-first-code-contribution)
  - [Pull requests](#pull-requests)
- [Development setup](#development-setup)
  - [Prerequisites](#prerequisites)
  - [Project layout](#project-layout)
  - [Building](#building)
  - [Running the demo](#running-the-demo)
- [Code style](#code-style)
- [Commit guidelines](#commit-guidelines)

## How can I contribute?

### Reporting bugs

Open an issue and describe:

1. **Steps to reproduce** — the more precise, the better. Include a minimal
   code snippet or a link to a repro repository.
2. **Expected behavior** — what you expected to happen.
3. **Actual behavior** — what actually happened, including stack traces and
   browser console errors.
4. **Environment** — Angular version, library version, browser and OS, and
   whether the CryptoPro plugin is involved.

### Suggesting enhancements

Enhancement suggestions are welcome as GitHub issues. Explain *what* you want
to achieve, *why* the current API makes it hard, and, if possible, sketch the
API you would like to see. Please check that a similar suggestion does not
already exist.

### Your first code contribution

Unsure where to start? Good first issues are tagged `good first issue` /
`help wanted` in the issue tracker. You can also pick anything under the
[`src/`](src) folder with a small surface, such as fixing an injection-token
doc comment or adding a unit test.

### Pull requests

1. Fork the repository and create your branch from `master`.
2. If you are adding a feature or fixing a bug, please add or update
   documentation and the demo when relevant.
3. Make sure the library builds: `npm run build`.
4. Make sure the demo builds: `npm run demo:build`.
5. Issue the pull request. Keep the diff focused on one concern and reference
   the issue it closes.

## Development setup

### Prerequisites

- Node.js **>= 18**
- npm **>= 9**

### Project layout

```
src/                 # the @wbd/editor library source
  components/        #   dialog / overlay components
  wb-editor-annotates/ # pdf-annotate.js-style annotation engine (optional dep)
  editor-signer.service.ts # CAdES signing pipeline
  editor-tokens.ts   #   injection tokens + abstract services
  public_api.ts      #   public API surface
demo/                # runnable demo application consuming file:../dist
dist/                # build output (generated, do not commit)
```

### Building

```bash
npm install
npm run build        # ng-packagr -> dist/
```

### Running the demo

The demo consumes the locally built package, so build the library first:

```bash
npm run build
npm run demo:install
npm run demo:serve   # http://localhost:4200
```

## Code style

- TypeScript, follow the style of the surrounding code.
- Component selectors are prefixed with `wbd-` / `app-` as existing code does.
- Do **not** commit `console.log` / `debugger` leftovers.
- Keep the public API surface minimal and documented; the public exports live
  in [`src/public_api.ts`](src/public_api.ts).

## Commit guidelines

- Use conventional, descriptive commit messages, e.g.
  `fix(signer): align visual signature placement` or
  `docs(demo): document the file management service`.
- One logical change per commit.
- Do not include unrelated refactors in the same commit.
