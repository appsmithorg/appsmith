"use strict";
/* eslint-disable prettier/prettier */
/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TempFileBackingStorage = exports.TempFile = void 0;
// import { ChunkedFileReader, type ChunkedReader } from './FileUtils.ts';
const buffer_1 = require("buffer");
const FileUtils_1 = require("./FileUtils");
class TempFile {
    #lastBlob;
    constructor() {
        this.#lastBlob = null;
    }
    write(pieces) {
        if (this.#lastBlob) {
            pieces.unshift(this.#lastBlob);
        }
        this.#lastBlob = new buffer_1.Blob(pieces, { type: 'text/plain' });
    }
    read() {
        return this.readRange();
    }
    size() {
        return this.#lastBlob ? this.#lastBlob.size : 0;
    }
    async readRange(startOffset, endOffset) {
        if (!this.#lastBlob) {
            return '';
        }
        const blob = typeof startOffset === 'number' || typeof endOffset === 'number' ?
            this.#lastBlob.slice(startOffset, endOffset) :
            this.#lastBlob;
        const reader = new FileReader();
        try {
            await new Promise((resolve, reject) => {
                reader.onloadend = resolve;
                reader.onerror = reject;
                reader.readAsText(blob);
            });
        }
        catch (error) {
        }
        return reader.result;
    }
    async copyToOutputStream(outputStream, progress) {
        if (!this.#lastBlob) {
            void outputStream.close();
            return null;
        }
        const reader = new FileUtils_1.ChunkedFileReader(this.#lastBlob, 10 * 1000 * 1000, progress);
        return reader.read(outputStream).then(success => success ? null : reader.error());
    }
    remove() {
        this.#lastBlob = null;
    }
}
exports.TempFile = TempFile;
class TempFileBackingStorage {
    #file;
    #strings;
    #stringsLength;
    constructor() {
        this.#file = null;
        this.reset();
    }
    appendString(string) {
        this.#strings.push(string);
        this.#stringsLength += string.length;
        const flushStringLength = 10 * 1024 * 1024;
        if (this.#stringsLength > flushStringLength) {
            this.flush();
        }
    }
    appendAccessibleString(string) {
        this.flush();
        if (!this.#file) {
            return async () => null;
        }
        const startOffset = this.#file.size();
        this.#strings.push(string);
        this.flush();
        return this.#file.readRange.bind(this.#file, startOffset, this.#file.size());
    }
    flush() {
        if (!this.#strings.length) {
            return;
        }
        if (!this.#file) {
            this.#file = new TempFile();
        }
        this.#stringsLength = 0;
        this.#file.write(this.#strings.splice(0));
    }
    finishWriting() {
        this.flush();
    }
    reset() {
        if (this.#file) {
            this.#file.remove();
        }
        this.#file = null;
        this.#strings = [];
        this.#stringsLength = 0;
    }
    writeToStream(outputStream) {
        return this.#file ? this.#file.copyToOutputStream(outputStream) : Promise.resolve(null);
    }
}
exports.TempFileBackingStorage = TempFileBackingStorage;
//# sourceMappingURL=TempFile.js.map