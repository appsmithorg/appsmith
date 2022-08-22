"use strict";
/* eslint-disable prettier/prettier */
// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileTreeModel = exports.ProfileNode = void 0;
// import { type Target } from './Target.js';
class ProfileNode {
    callFrame;
    callUID;
    self;
    total;
    id;
    parent;
    children;
    depth;
    deoptReason;
    constructor(callFrame) {
        this.callFrame = callFrame;
        this.callUID = `${callFrame.functionName}@${callFrame.scriptId}:${callFrame.lineNumber}:${callFrame.columnNumber}`;
        this.self = 0;
        this.total = 0;
        this.id = 0;
        this.parent = null;
        this.children = [];
    }
    get functionName() {
        return this.callFrame.functionName;
    }
    get scriptId() {
        return String(this.callFrame.scriptId);
    }
    get url() {
        return this.callFrame.url;
    }
    get lineNumber() {
        return this.callFrame.lineNumber;
    }
    get columnNumber() {
        return this.callFrame.columnNumber;
    }
}
exports.ProfileNode = ProfileNode;
class ProfileTreeModel {
    #targetInternal;
    root;
    total;
    maxDepth;
    constructor(target) {
        this.#targetInternal = target || null;
    }
    initialize(root) {
        this.root = root;
        this.assignDepthsAndParents();
        this.total = this.calculateTotals(this.root);
    }
    assignDepthsAndParents() {
        const root = this.root;
        root.depth = -1;
        root.parent = null;
        this.maxDepth = 0;
        const nodesToTraverse = [root];
        while (nodesToTraverse.length) {
            const parent = nodesToTraverse.pop();
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
    calculateTotals(root) {
        const nodesToTraverse = [root];
        const dfsList = [];
        while (nodesToTraverse.length) {
            const node = nodesToTraverse.pop();
            node.total = node.self;
            dfsList.push(node);
            nodesToTraverse.push(...node.children);
        }
        while (dfsList.length > 1) {
            const node = dfsList.pop();
            if (node.parent) {
                node.parent.total += node.total;
            }
        }
        return root.total;
    }
    target() {
        return this.#targetInternal;
    }
}
exports.ProfileTreeModel = ProfileTreeModel;
//# sourceMappingURL=ProfileTreeModel.js.map