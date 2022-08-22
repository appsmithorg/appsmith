/* eslint-disable prettier/prettier */


// import type * as Common from '../../core/common/common.js';
// import type * as Platform from '../../core/platform/platform.js';
// import * as Workspace from '../workspace/workspace.js';
class UrlStringTag {
  private urlTag: (string|undefined);
}
/**
 * File paths in DevTools that are represented as URLs
 * @example
 * “file:///Hello%20World/file/js”
 */
export type UrlString = string&UrlStringTag;
class RawPathStringTag {
  private rawPathTag: (string|undefined);
}
/**
 * File paths in DevTools that are represented as unencoded absolute
 * or relative paths
 * @example
 * “/Hello World/file.js”
 */
export type RawPathString = string&RawPathStringTag;
interface DOMError {
  readonly name: string;
  readonly message: string;
}
interface OutputStream {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}
interface EventTargetEvent<T> {
  data: T;
}
export interface ChunkedReader {
  fileSize(): number;

  loadedSize(): number;

  fileName(): string;

  cancel(): void;

  error(): DOMError|null;
}
interface DecompressionStream extends GenericTransformStream {
  readonly format: string;
}
declare const DecompressionStream: {
  prototype: DecompressionStream,
  new (format: string): DecompressionStream,
};

export class ChunkedFileReader implements ChunkedReader {
  #file: File|null;
  readonly #fileSizeInternal: number;
  #loadedSizeInternal: number;
  #streamReader: ReadableStreamReader<Uint8Array>|null;
  readonly #chunkSize: number;
  readonly #chunkTransferredCallback: ((arg0: ChunkedReader) => void)|undefined;
  readonly #decoder: TextDecoder;
  #isCanceled: boolean;
  #errorInternal: DOMException|null;
  #transferFinished!: (arg0: boolean) => void;
  #output?: OutputStream;
  #reader?: FileReader|null;

  constructor(file: File, chunkSize: number, chunkTransferredCallback?: ((arg0: ChunkedReader) => void)) {
    this.#file = file;
    this.#fileSizeInternal = file.size;
    this.#loadedSizeInternal = 0;
    this.#chunkSize = chunkSize;
    this.#chunkTransferredCallback = chunkTransferredCallback;
    this.#decoder = new TextDecoder();
    this.#isCanceled = false;
    this.#errorInternal = null;
    this.#streamReader = null;
  }

  async read(output: OutputStream): Promise<boolean> {
    if (this.#chunkTransferredCallback) {
      this.#chunkTransferredCallback(this);
    }

    if (this.#file?.type.endsWith('gzip')) {
      // const stream = this.decompressStream(this.#file.stream());
      // this.#streamReader = stream.getReader();
    } else {
      this.#reader = new FileReader();
      this.#reader.onload = this.onChunkLoaded.bind(this);
      this.#reader.onerror = this.onError.bind(this);
    }

    this.#output = output;
    void this.loadChunk();

    return new Promise(resolve => {
      this.#transferFinished = resolve;
    });
  }

  cancel(): void {
    this.#isCanceled = true;
  }

  loadedSize(): number {
    return this.#loadedSizeInternal;
  }

  fileSize(): number {
    return this.#fileSizeInternal;
  }

  fileName(): string {
    if (!this.#file) {
      return '';
    }
    return this.#file.name;
  }

  error(): DOMException|null {
    return this.#errorInternal;
  }

  // Decompress gzip natively thanks to https://wicg.github.io/compression/
  private decompressStream(stream: ReadableStream): ReadableStream {
    const ds = new DecompressionStream('gzip');
    const decompressionStream = stream.pipeThrough(ds);
    return decompressionStream;
  }

  private onChunkLoaded(event: Event): void {
    if (this.#isCanceled) {
      return;
    }

    const eventTarget = (event.target as FileReader);
    if (eventTarget.readyState !== FileReader.DONE) {
      return;
    }

    if (!this.#reader) {
      return;
    }

    const buffer = (this.#reader.result as ArrayBuffer);
    this.#loadedSizeInternal += buffer.byteLength;
    const endOfFile = this.#loadedSizeInternal === this.#fileSizeInternal;
    void this.decodeChunkBuffer(buffer, endOfFile);
  }

  private async decodeChunkBuffer(buffer: ArrayBuffer, endOfFile: boolean): Promise<void> {
    if (!this.#output) {
      return;
    }
    const decodedString = this.#decoder.decode(buffer, {stream: !endOfFile});
    await this.#output.write(decodedString);
    if (this.#isCanceled) {
      return;
    }
    if (this.#chunkTransferredCallback) {
      this.#chunkTransferredCallback(this);
    }

    if (endOfFile) {
      this.finishRead();
      return;
    }
    void this.loadChunk();
  }

  private finishRead(): void {
    if (!this.#output) {
      return;
    }
    this.#file = null;
    this.#reader = null;
    void this.#output.close();
    this.#transferFinished(!this.#errorInternal);
  }

  private async loadChunk(): Promise<void> {
    if (!this.#output || !this.#file) {
      return;
    }
    if (this.#streamReader) {
      const {done, value} = await this.#streamReader.read();
      if (done || !value) {
        return this.finishRead();
      }
      void this.decodeChunkBuffer(value.buffer, false);
    }
    if (this.#reader) {
      const chunkStart = this.#loadedSizeInternal;
      const chunkEnd = Math.min(this.#fileSizeInternal, chunkStart + this.#chunkSize);
      const nextPart = this.#file.slice(chunkStart, chunkEnd);
      this.#reader.readAsArrayBuffer(nextPart);
    }
  }

  private onError(event: Event): void {
    const eventTarget = (event.target as FileReader);
    this.#errorInternal = eventTarget.error;
    this.#transferFinished(false);
  }
}

export class FileOutputStream implements OutputStream {
  #writeCallbacks: (() => void)[];
  #fileName!: RawPathString|UrlString;
  #closed?: boolean;
  constructor() {
    this.#writeCallbacks = [];
  }

  async open(fileName: RawPathString|UrlString): Promise<boolean> {
    this.#closed = false;
    this.#writeCallbacks = [];
    this.#fileName = fileName;
    // const saveResponse = await Workspace.FileManager.FileManager.instance().save(this.#fileName, '', true);
    // if (saveResponse) {
      // Workspace.FileManager.FileManager.instance().addEventListener(
      //     Workspace.FileManager.Events.AppendedToURL, this.onAppendDone, this);
    // }
    return true;
  }

  write(data: string): Promise<void> {
    return new Promise(resolve => {
      this.#writeCallbacks.push(resolve);
      // Workspace.FileManager.FileManager.instance().append(this.#fileName, data);
    });
  }

  async close(): Promise<void> {
    this.#closed = true;
    if (this.#writeCallbacks.length) {
      return;
    }
    // Workspace.FileManager.FileManager.instance().removeEventListener(
    //     Workspace.FileManager.Events.AppendedToURL, this.onAppendDone, this);
    // Workspace.FileManager.FileManager.instance().close(this.#fileName);
  }

  private onAppendDone(event: EventTargetEvent<string>): void {
    if (event.data !== this.#fileName) {
      return;
    }
    const writeCallback = this.#writeCallbacks.shift();
    if (writeCallback) {
      writeCallback();
    }
    if (this.#writeCallbacks.length) {
      return;
    }
    if (!this.#closed) {
      return;
    }
    // Workspace.FileManager.FileManager.instance().removeEventListener(
    //     Workspace.FileManager.Events.AppendedToURL, this.onAppendDone, this);
    // Workspace.FileManager.FileManager.instance().close(this.#fileName);
  }
}
