import { UrlString } from "./FileUtils";

export interface DOMError {
  readonly name: string;
  readonly message: string;
}
export interface OutputStream {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}
export type integer = number;
type OpaqueType<Tag extends string> = { protocolOpaqueTypeTag: Tag };

type OpaqueIdentifier<
  RepresentationType,
  Tag extends string
> = RepresentationType & OpaqueType<Tag>;

export type ScriptId = OpaqueIdentifier<string, "Protocol.Runtime.ScriptId">;

export interface CallFrame {
  /**
   * JavaScript function name.
   */
  functionName: string;
  /**
   * JavaScript script id.
   */
  scriptId: ScriptId;
  /**
   * JavaScript script name or url.
   */
  url: string;
  /**
   * JavaScript script line number (0-based).
   */
  lineNumber: integer;
  /**
   * JavaScript script column number (0-based).
   */
  columnNumber: integer;
}
export type FrameId = OpaqueIdentifier<string, "Protocol.Page.FrameId">;
// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export type Values = {
  [key: string]: string | boolean | number;
};

export interface SerializedMessage {
  string: string;
  values: Values;
}

export class ProfileNode {
  callFrame: CallFrame;
  callUID: string;
  self: number;
  total: number;
  id: number;
  parent: ProfileNode | null;
  children: ProfileNode[];
  depth!: number;
  deoptReason!: string | null;

  constructor(callFrame: CallFrame) {
    this.callFrame = callFrame;
    this.callUID = `${callFrame.functionName}@${callFrame.scriptId}:${callFrame.lineNumber}:${callFrame.columnNumber}`;
    this.self = 0;
    this.total = 0;
    this.id = 0;
    this.parent = null;
    this.children = [];
  }

  get functionName(): string {
    return this.callFrame.functionName;
  }

  get scriptId(): ScriptId {
    return String(this.callFrame.scriptId) as ScriptId;
  }

  get url(): UrlString {
    return this.callFrame.url as UrlString;
  }

  get lineNumber(): number {
    return this.callFrame.lineNumber;
  }

  get columnNumber(): number {
    return this.callFrame.columnNumber;
  }
}
