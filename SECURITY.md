# Security Policy

## Reporting a vulnerability

If you discover a security issue in this project, **do not open a public
issue**. Please report it privately to the maintainers by emailing
`security@weldbook.ru` (or the maintainer address listed on the repository
homepage), including:

- a description of the vulnerability,
- the affected version(s),
- a minimal reproduction,
- any suggested remediation if you have one.

You will receive an acknowledgement within **5 business days**, and we will
work with you to understand the impact and release a fix as soon as possible.

## Scope

In scope:

- the `@wbd/editor` library source under [`src/`](src),
- the demo application under [`demo/`](demo).

Out of scope:

- the CryptoPro CAdES browser plugin itself,
- PDF.js / pdf-lib / Angular and other third-party dependencies (report those
  to their respective projects).

## Security notes for consumers

- The library renders PDF documents and executes annotation markup inside an
  embedded PDF.js viewer. Treat the documents you open as untrusted content and
  use the viewer in a sandboxed context where your threat model requires it.
- The digital-signature flow uses the `crypto-pro` browser plugin; never
  transmit private keys or raw certificate stores over the network from this
  library.
- Review the backend endpoints your `EditorSignerService` usage talks to: the
  library itself does not authenticate or authorize any backend request.
