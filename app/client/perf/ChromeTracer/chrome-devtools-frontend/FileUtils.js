"use strict";
/* eslint-disable prettier/prettier */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileOutputStream = exports.ChunkedFileReader = void 0;
// import type * as Common from '../../core/common/common.js';
// import type * as Platform from '../../core/platform/platform.js';
// import * as Workspace from '../workspace/workspace.js';
class UrlStringTag {
    urlTag;
}
class RawPathStringTag {
    rawPathTag;
}
class ChunkedFileReader {
    #file;
    #fileSizeInternal;
    #loadedSizeInternal;
    #streamReader;
    #chunkSize;
    #chunkTransferredCallback;
    #decoder;
    #isCanceled;
    #errorInternal;
    #transferFinished;
    #output;
    #reader;
    constructor(file, chunkSize, chunkTransferredCallback) {
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
    async read(output) {
        if (this.#chunkTransferredCallback) {
            this.#chunkTransferredCallback(this);
        }
        if (this.#file?.type.endsWith('gzip')) {
            // const stream = this.decompressStream(this.#file.stream());
            // this.#streamReader = stream.getReader();
        }
        else {
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
    cancel() {
        this.#isCanceled = true;
    }
    loadedSize() {
        return this.#loadedSizeInternal;
    }
    fileSize() {
        return this.#fileSizeInternal;
    }
    fileName() {
        if (!this.#file) {
            return '';
        }
        return this.#file.name;
    }
    error() {
        return this.#errorInternal;
    }
    // Decompress gzip natively thanks to https://wicg.github.io/compression/
    decompressStream(stream) {
        const ds = new DecompressionStream('gzip');
        const decompressionStream = stream.pipeThrough(ds);
        return decompressionStream;
    }
    onChunkLoaded(event) {
        if (this.#isCanceled) {
            return;
        }
        const eventTarget = event.target;
        if (eventTarget.readyState !== FileReader.DONE) {
            return;
        }
        if (!this.#reader) {
            return;
        }
        const buffer = this.#reader.result;
        this.#loadedSizeInternal += buffer.byteLength;
        const endOfFile = this.#loadedSizeInternal === this.#fileSizeInternal;
        void this.decodeChunkBuffer(buffer, endOfFile);
    }
    async decodeChunkBuffer(buffer, endOfFile) {
        if (!this.#output) {
            return;
        }
        const decodedString = this.#decoder.decode(buffer, { stream: !endOfFile });
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
    finishRead() {
        if (!this.#output) {
            return;
        }
        this.#file = null;
        this.#reader = null;
        void this.#output.close();
        this.#transferFinished(!this.#errorInternal);
    }
    async loadChunk() {
        if (!this.#output || !this.#file) {
            return;
        }
        if (this.#streamReader) {
            const { done, value } = await this.#streamReader.read();
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
    onError(event) {
        const eventTarget = event.target;
        this.#errorInternal = eventTarget.error;
        this.#transferFinished(false);
    }
}
exports.ChunkedFileReader = ChunkedFileReader;
class FileOutputStream {
    #writeCallbacks;
    #fileName;
    #closed;
    constructor() {
        this.#writeCallbacks = [];
    }
    async open(fileName) {
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
    write(data) {
        return new Promise(resolve => {
            this.#writeCallbacks.push(resolve);
            // Workspace.FileManager.FileManager.instance().append(this.#fileName, data);
        });
    }
    async close() {
        this.#closed = true;
        if (this.#writeCallbacks.length) {
            return;
        }
        // Workspace.FileManager.FileManager.instance().removeEventListener(
        //     Workspace.FileManager.Events.AppendedToURL, this.onAppendDone, this);
        // Workspace.FileManager.FileManager.instance().close(this.#fileName);
    }
    onAppendDone(event) {
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
exports.FileOutputStream = FileOutputStream;
//# sourceMappingURL=FileUtils.js.map