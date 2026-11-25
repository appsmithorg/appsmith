# Support diagnostics ZIP contract

The browser builds the ZIP from the section results it already holds. `buildReport` in `buildReport.ts` makes the JSON files. `zipReport` in `zipReport.ts` writes them into the archive. The server never sees the ZIP or the password.

## File names

| Download           | Name                                                      |
| ------------------ | --------------------------------------------------------- |
| Plain              | `appsmith-support-diagnostics-YYYYMMDD.zip`               |
| Password-protected | `appsmith-support-diagnostics-encrypted-YYYYMMDD.zip`     |

`YYYYMMDD` is the UTC date of the download (`reportFileName`).

## Contents

All entries are JSON, at the top level of the archive:

- `manifest.json`
- `summary.json`
- One file per selected section: `instance.json`, `deployment.json`, `feature-flags.json`, `applications.json`, `datasources.json`, `workflows.json`, `identity.json`, `ai-mcp.json`, `health.json` (`SECTION_FILE_NAMES`).

An unchecked section contributes no file and no data. Its ID appears only in `excludedSectionIds`. The download is disabled when no section is selected.

## Section files

A section with status `OK`:

```json
{
  "sectionId": "APPLICATIONS",
  "status": "OK",
  "collectedAt": "2026-11-17T10:00:00.000Z",
  "data": {}
}
```

`collectedAt` is the UTC time as an ISO 8601 string, or `null` when it is not known.

A selected section with any other status holds no data:

```json
{
  "sectionId": "HEALTH",
  "status": "UNAVAILABLE",
  "errorCode": "timeout"
}
```

`errorCode` is a short code from the server (for example `timeout`, `collector_failed`, `key_not_allowed`), or `null`. Read it as plain text. The set of codes can grow.

`instance.json` also holds two fields that only the browser knows:

- `instanceUrl`: `window.location.origin` of the admin's browser. It is the origin only, never a path or query.
- `publicUrlMismatch`: `true` or `false` when the origin differs from the configured public URL. `"UNKNOWN"` when either value is not an http(s) URL.

## `summary.json`

Built from the selected sections only:

| Field             | Value                                                                              |
| ----------------- | ---------------------------------------------------------------------------------- |
| `edition`         | From `INSTANCE`, or `"UNKNOWN"` when that section is not selected or not `OK`      |
| `appVersion`      | From `INSTANCE`, or `"UNKNOWN"`                                                    |
| `deploymentTool`  | From `DEPLOYMENT`, or `"UNKNOWN"`                                                  |
| `sectionStatus`   | Status of each selected section                                                    |

## `manifest.json`

| Field                | Value                                                                         |
| -------------------- | ----------------------------------------------------------------------------- |
| `schemaVersion`      | `1`                                                                           |
| `generatedAt`        | UTC time as an ISO 8601 string                                                |
| `edition`            | Same as `summary.json`                                                        |
| `appVersion`         | Same as `summary.json`                                                        |
| `collectorVersion`   | From the list endpoint (`SupportDiagnosticsServiceCE.COLLECTOR_VERSION`)      |
| `selectedSectionIds` | Selected section IDs, in display order                                        |
| `excludedSectionIds` | Section IDs that were not selected                                            |
| `sectionStatus`      | Status of each selected section                                               |
| `sha256`             | Lowercase hex SHA-256 of the UTF-8 text of each file, except `manifest.json`  |

The manifest does not hash itself. A reader checks a file by hashing its bytes and comparing the result with `sha256[<file name>]`.

Hashes use `js-sha256`, not Web Crypto. `crypto.subtle` exists only in secure contexts, and self-hosted instances often run on plain `http://`.

## Size limit

The files together may hold at most 1,048,576 UTF-8 bytes (`MAX_REPORT_BYTES`). `buildReport` throws `ReportTooLargeError` above that, and the page shows an error instead of a download. The server also caps each section at 100 KB, so the limit is reached only when all sections are near that cap.

## Encryption

Without a password, `zipReport` writes a plain ZIP.

With a password, every entry is encrypted with WinZip AE-2 AES-256 through `@zip.js/zip.js` 2.24.0 (`encryptionStrength: 3`). ZipCrypto is never used (`zipCrypto: false`). File names are not encrypted. They are visible without the password.

The code loads the zip.js native entry (`@zip.js/zip.js/index-native.js`) with a dynamic `import()`. That entry has no WebAssembly and no web worker, and it stays out of the admin settings bundle. On plain `http://`, zip.js derives the key with its own PBKDF2 code, because Web Crypto is not available.

### Why the password must be random

AE-2 derives the AES key and the password check from the password with PBKDF2-HMAC-SHA1 at **1,000 iterations**. That count is fixed by the WinZip AE format. It is low by current standards. An attacker who holds the ZIP can test passwords quickly offline, and the 2-byte password verifier on each entry speeds that up.

The strength of the ZIP therefore depends on the password:

- Use a long random password. The page asks for 12 to 128 characters and checks only length (counted as code points, `isValidPassword`). It does not measure strength and does not generate a password.
- Send the password to support through a different channel than the ZIP.
- The password stays in browser memory. `zipReport` does not log it, store it, or put it in an error.

## How support opens an encrypted ZIP

Windows File Explorer and the macOS Finder (Archive Utility) cannot open AES-encrypted ZIPs. The page says so (`SUPPORT_DIAGNOSTICS.aesWarning`). Use a tool that supports WinZip AES:

| Platform | Tool                       |
| -------- | -------------------------- |
| Windows  | 7-Zip, WinZip              |
| macOS    | Keka, WinZip               |
| Linux    | `7z` (p7zip or 7-Zip)      |

With the command line:

```text
7z x appsmith-support-diagnostics-encrypted-YYYYMMDD.zip
```

The tool asks for the password. A wrong password fails the extract.

To check integrity, hash each extracted file and compare it with `sha256` in `manifest.json`:

```text
shasum -a 256 instance.json
```

A plain ZIP opens with every tool, including the built-in ones.
