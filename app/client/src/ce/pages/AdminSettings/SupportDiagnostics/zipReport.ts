import type { ReportFiles } from "./buildReport";

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

/** Counts code points, so an emoji counts as one character. */
export function isValidPassword(password: string): boolean {
  const length = [...password].length;

  return length >= PASSWORD_MIN && length <= PASSWORD_MAX;
}

/**
 * Writes the report files into a ZIP archive in the browser.
 * With a password, every entry is encrypted with AES-256 (never ZipCrypto).
 * The password stays in memory: it is not logged, stored, or put in an error.
 */
export async function zipReport(
  files: ReportFiles,
  password?: string,
): Promise<Uint8Array> {
  // The native entry has no wasm and no worker; loading it here keeps zip.js
  // out of the admin settings chunk.
  const zip = await import("@zip.js/zip.js/index-native.js");

  zip.configure({ useWebWorkers: false });

  const writer = new zip.ZipWriter(
    new zip.Uint8ArrayWriter(),
    password ? { password, encryptionStrength: 3, zipCrypto: false } : {},
  );

  const encoder = new TextEncoder();

  for (const [name, text] of Object.entries(files)) {
    await writer.add(name, new zip.Uint8ArrayReader(encoder.encode(text)));
  }

  return writer.close();
}

export function saveBytes(bytes: Uint8Array, fileName: string): void {
  const url = URL.createObjectURL(
    new Blob([bytes], { type: "application/zip" }),
  );
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);

  try {
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}
