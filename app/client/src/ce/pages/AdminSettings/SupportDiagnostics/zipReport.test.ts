import { objectKeys } from "@appsmith/utils";
import {
  isValidPassword,
  PASSWORD_MAX,
  PASSWORD_MIN,
  saveBytes,
  zipReport,
} from "./zipReport";
import type { ReportFiles } from "./buildReport";

// jsdom has no web streams; zip.js needs them to deflate, inflate and encrypt.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const web = require("node:stream/web");

Object.assign(globalThis, {
  CompressionStream: web.CompressionStream,
  DecompressionStream: web.DecompressionStream,
  ReadableStream: web.ReadableStream,
  TransformStream: web.TransformStream,
  WritableStream: web.WritableStream,
});

const FILES: ReportFiles = {
  "manifest.json": '{"schemaVersion":1}',
  "sections/instance.json": '{"version":"v1.2.3","note":"ünïcødé 😀"}',
};

const AES_EXTRA_FIELD = [0x01, 0x99, 0x07, 0x00, 0x02, 0x00, 0x41, 0x45, 0x03];

function indexOfBytes(haystack: Uint8Array, needle: number[]): number {
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    if (needle.every((byte, j) => haystack[i + j] === byte)) return i;
  }

  return -1;
}

async function readZip(bytes: Uint8Array, password?: string) {
  const zip = await import("@zip.js/zip.js/index-native.js");

  zip.configure({ useWebWorkers: false });
  const reader = new zip.ZipReader(
    new zip.Uint8ArrayReader(bytes),
    password ? { password } : {},
  );

  try {
    const entries = await reader.getEntries();
    const decoder = new TextDecoder();
    const files: ReportFiles = {};

    for (const entry of entries) {
      if (entry.directory) continue;

      files[entry.filename] = decoder.decode(
        await entry.getData(new zip.Uint8ArrayWriter()),
      );
    }

    return { entries, files };
  } finally {
    await reader.close();
  }
}

describe("isValidPassword", () => {
  it("should_validatePasswordByCodePoints", () => {
    expect(PASSWORD_MIN).toBe(12);
    expect(PASSWORD_MAX).toBe(128);
    expect(isValidPassword("a".repeat(11))).toBe(false);
    expect(isValidPassword("a".repeat(12))).toBe(true);
    expect(isValidPassword("a".repeat(128))).toBe(true);
    expect(isValidPassword("a".repeat(129))).toBe(false);
    expect("😀".repeat(6).length).toBe(12);
    expect(isValidPassword("😀".repeat(6))).toBe(false);
    expect("😀".repeat(100).length).toBe(200);
    expect(isValidPassword("😀".repeat(100))).toBe(true);
  });
});

describe("zipReport", () => {
  it("should_roundTripPlainZip", async () => {
    const bytes = await zipReport(FILES);
    const { entries, files } = await readZip(bytes);

    expect(files).toEqual(FILES);
    expect(entries.every((entry) => !entry.encrypted)).toBe(true);
  });

  it("should_encryptWithAes256_when_passwordGiven", async () => {
    const password = "correct horse battery";
    const bytes = await zipReport(FILES, password);
    const { entries, files } = await readZip(bytes, password);

    expect(files).toEqual(FILES);
    expect(entries).toHaveLength(objectKeys(FILES).length);
    expect(entries.every((entry) => entry.encrypted)).toBe(true);
    expect(indexOfBytes(bytes, AES_EXTRA_FIELD)).toBeGreaterThan(-1);
    // Local file header: signature PK\x03\x04, then the method at offset 8.
    expect(Array.from(bytes.subarray(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(Array.from(bytes.subarray(8, 10))).toEqual([0x63, 0x00]);

    const zip = await import("@zip.js/zip.js/index-native.js");

    await expect(readZip(bytes, "wrong-password!")).rejects.toThrow(
      zip.ERR_INVALID_PASSWORD,
    );
  });
});

describe("saveBytes", () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;

  afterEach(() => {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    jest.restoreAllMocks();
  });

  it("should_saveBytesAsZipFile", () => {
    const createObjectURL = jest.fn((blob: Blob) => {
      expect(blob.type).toBe("application/zip");

      return "blob:report";
    });
    const revokeObjectURL = jest.fn();

    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    let attachedWhenClicked = false;
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        attachedWhenClicked = document.body.contains(this);
      });

    saveBytes(new Uint8Array([1, 2, 3]), "x.zip");

    const clicked = click.mock.contexts[0] as HTMLAnchorElement | undefined;

    expect(click).toHaveBeenCalledTimes(1);
    expect(attachedWhenClicked).toBe(true);
    expect(clicked?.download).toBe("x.zip");
    expect(clicked?.getAttribute("href")).toBe("blob:report");
    expect(document.body.contains(clicked ?? null)).toBe(false);
    expect(document.querySelectorAll("a[download]")).toHaveLength(0);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:report");
  });
});
