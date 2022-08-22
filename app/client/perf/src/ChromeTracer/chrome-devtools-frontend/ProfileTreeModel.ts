/* eslint-disable prettier/prettier */
// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { CallFrame, ScriptId } from './chrome-devtools-types';
import { UrlString } from './FileUtils';

// import { type Target } from './Target.js';

export class ProfileNode {
  callFrame: CallFrame;
  callUID: string;
  self: number;
  total: number;
  id: number;
  parent: ProfileNode|null;
  children: ProfileNode[];
  depth!: number;
  deoptReason!: string|null;

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

export class ProfileTreeModel {
  readonly #targetInternal: any;
  root!: ProfileNode;
  total!: number;
  maxDepth!: number;
  constructor(target?: any) {
    this.#targetInternal = target || null;
  }

  initialize(root: ProfileNode): void {
    this.root = root;
    this.assignDepthsAndParents();
    this.total = this.calculateTotals(this.root);
  }

  private assignDepthsAndParents(): void {
    const root = this.root;
    root.depth = -1;
    root.parent = null;
    this.maxDepth = 0;
    const nodesToTraverse = [root];
    while (nodesToTraverse.length) {
      const parent = (nodesToTraverse.pop() as ProfileNode);
      const depth = parent.depth + 1;
      if (depth > this.maxDepth) {
        this.maxDepth = depth;
      }
      const children = parent.children;
      for (const child of children) {
        child.depth = depth;
        child.parent = parent;
        if (child.children.length) {
          nodesToTraverse.push(child);
        }
      }
    }
  }

  private calculateTotals(root: ProfileNode): number {
    const nodesToTraverse = [root];
    const dfsList: any = [];
    while (nodesToTraverse.length) {
      const node = (nodesToTraverse.pop() as ProfileNode);
      node.total = node.self;
      dfsList.push(node);
      nodesToTraverse.push(...node.children);
    }
    while (dfsList.length > 1) {
      const node = (dfsList.pop() as ProfileNode);
      if (node.parent) {
        node.parent.total += node.total;
      }
    }
    return root.total;
  }

  target(): any {
    return this.#targetInternal;
  }
}
