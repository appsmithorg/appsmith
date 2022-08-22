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


// import { ChunkedFileReader, type ChunkedReader } from './FileUtils.ts';
import { Blob } from "buffer";
import { DOMError, OutputStream } from './chrome-devtools-types';
import { ChunkedFileReader, ChunkedReader } from './FileUtils';
import * as TracingModel from './TracingModel';
export class TempFile {
  #lastBlob: Blob|null;
  constructor() {
    this.#lastBlob = null;
  }

  write(pieces: (string|Blob)[]): void {
    if (this.#lastBlob) {
      pieces.unshift(this.#lastBlob);
    }
    this.#lastBlob = new Blob(pieces, {type: 'text/plain'});
  }

  read(): Promise<string|null> {
    return this.readRange();
  }

  size(): number {
    return this.#lastBlob ? this.#lastBlob.size : 0;
  }

  async readRange(startOffset?: number, endOffset?: number): Promise<string|null> {
    if (!this.#lastBlob) {
      return '';
    }
    const blob: any = typeof startOffset === 'number' || typeof endOffset === 'number' ?
        this.#lastBlob.slice((startOffset as number), (endOffset as number)) :
        this.#lastBlob;

    const reader = new FileReader();
    try {
      await new Promise((resolve, reject) => {
        reader.onloadend = resolve;
        reader.onerror = reject;
        reader.readAsText(blob);
      });
    } catch (error) {
    }

    return reader.result as string | null;
  }

  async copyToOutputStream(
      outputStream: OutputStream,
      progress?: ((arg0: ChunkedReader) => void)): Promise<DOMError|null> {
    if (!this.#lastBlob) {
      void outputStream.close();
      return null;
    }
    const reader = new ChunkedFileReader((this.#lastBlob as File), 10 * 1000 * 1000, progress);
    return reader.read(outputStream).then(success => success ? null : reader.error());
  }

  remove(): void {
    this.#lastBlob = null;
  }
}

export class TempFileBackingStorage implements TracingModel.BackingStorage {
  #file: TempFile|null;
  #strings!: string[];
  #stringsLength!: number;

  constructor() {
    this.#file = null;
    this.reset();
  }

  appendString(string: string): void {
    this.#strings.push(string);
    this.#stringsLength += string.length;
    const flushStringLength = 10 * 1024 * 1024;
    if (this.#stringsLength > flushStringLength) {
      this.flush();
    }
  }

  appendAccessibleString(string: string): () => Promise<string|null> {
    this.flush();
    if (!this.#file) {
      return async(): Promise<null> => null;
    }
    const startOffset = this.#file.size();
    this.#strings.push(string);
    this.flush();
    return this.#file.readRange.bind(this.#file, startOffset, this.#file.size());
  }

  private flush(): void {
    if (!this.#strings.length) {
      return;
    }
    if (!this.#file) {
      this.#file = new TempFile();
    }
    this.#stringsLength = 0;
    this.#file.write(this.#strings.splice(0));
  }

  finishWriting(): void {
    this.flush();
  }

  reset(): void {
    if (this.#file) {
      this.#file.remove();
    }
    this.#file = null;
    this.#strings = [];
    this.#stringsLength = 0;
  }

  writeToStream(outputStream: OutputStream): Promise<DOMError|null> {
    return this.#file ? this.#file.copyToOutputStream(outputStream) : Promise.resolve(null);
  }
}
