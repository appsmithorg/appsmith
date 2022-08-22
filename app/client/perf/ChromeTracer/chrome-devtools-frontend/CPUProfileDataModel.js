"use strict";
/* eslint-disable prettier/prettier */
/* eslint-disable prefer-spread */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.CPUProfileDataModel = exports.CPUProfileNode = void 0;
// import type * as Protocol from '../../generated/protocol.js';
// import * as i18n from "./i18n";
const array_utilitties_1 = require("./array-utilitties");
const ProfileTreeModel_1 = require("./ProfileTreeModel");
const UIStrings = {
    /**
     * @description Text in CPUProfile Data Model. The phrase is a warning shown to users when
     * DevTools has received incomplete data and tries to interpolate the missing data manually.
     * The placeholder is always a number, and references the number of data points that DevTools
     * is trying to fix up.
     * A sample is a single point of recorded data at a specific point in time. If many such samples
     * are collected over a period of time, its called a "profile". In this context, "CPU profile"
     * means collected data about the behavior of the CPU.
     * "Parser" in this context is the piece of DevTools, that interprets the collected samples.
     * @example {2} PH1
     */
    devtoolsCpuProfileParserIsFixing: '`DevTools`: `CPU` profile parser is fixing {PH1} missing samples.',
};
// const str_ = i18n.registerUIStrings('core/sdk/CPUProfileDataModel.ts', UIStrings);
// const i18nString = i18n.getLocalizedString.bind(undefined, str_);
class CPUProfileNode extends ProfileTreeModel_1.ProfileNode {
    //   id: any;
    //   self: any;
    positionTicks;
    //   deoptReason: any;
    constructor(node, sampleTime) {
        const callFrame = node.callFrame || {
            // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
            functionName: node['functionName'],
            // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
            scriptId: node['scriptId'],
            // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
            url: node['url'],
            // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
            lineNumber: node['lineNumber'] - 1,
            // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
            columnNumber: node['columnNumber'] - 1,
        };
        super(callFrame);
        this.id = node.id;
        this.self = (node.hitCount || 0) * sampleTime;
        this.positionTicks = node.positionTicks;
        // Compatibility: legacy backends could provide "no reason" for optimized functions.
        this.deoptReason = node.deoptReason && node.deoptReason !== 'no reason' ? node.deoptReason : null;
    }
}
exports.CPUProfileNode = CPUProfileNode;
class CPUProfileDataModel extends ProfileTreeModel_1.ProfileTreeModel {
    profileStartTime;
    profileEndTime;
    timestamps;
    samples;
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lines;
    totalHitCount;
    profileHead;
    #idToNode;
    gcNode;
    programNode;
    idleNode;
    #stackStartTimes;
    #stackChildrenDuration;
    constructor(profile, target) {
        super(target);
        // @ts-ignore Legacy types
        const isLegacyFormat = Boolean(profile['head']);
        if (isLegacyFormat) {
            // Legacy format contains raw timestamps and start/stop times are in seconds.
            this.profileStartTime = profile.startTime * 1000;
            this.profileEndTime = profile.endTime * 1000;
            // @ts-ignore Legacy types
            this.timestamps = profile.timestamps;
            this.compatibilityConversionHeadToNodes(profile);
        }
        else {
            // Current format encodes timestamps as deltas. Start/stop times are in microseconds.
            this.profileStartTime = profile.startTime / 1000;
            this.profileEndTime = profile.endTime / 1000;
            this.timestamps = this.convertTimeDeltas(profile);
        }
        this.samples = profile.samples;
        // @ts-ignore Legacy types
        this.lines = profile.lines;
        this.totalHitCount = 0;
        this.profileHead = this.translateProfileTree(profile.nodes);
        this.initialize(this.profileHead);
        this.extractMetaNodes();
        if (this.samples) {
            this.buildIdToNodeMap();
            this.sortSamples();
            this.normalizeTimestamps();
            this.fixMissingSamples();
        }
    }
    compatibilityConversionHeadToNodes(profile) {
        // @ts-ignore Legacy types
        if (!profile.head || profile.nodes) {
            return;
        }
        const nodes = [];
        // @ts-ignore Legacy types
        convertNodesTree(profile.head);
        profile.nodes = nodes;
        // @ts-ignore Legacy types
        delete profile.head;
        function convertNodesTree(node) {
            nodes.push(node);
            // @ts-ignore Legacy types
            node.children = node.children.map(convertNodesTree);
            return node.id;
        }
    }
    convertTimeDeltas(profile) {
        if (!profile.timeDeltas) {
            return [];
        }
        let lastTimeUsec = profile.startTime;
        const timestamps = new Array(profile.timeDeltas.length);
        for (let i = 0; i < profile.timeDeltas.length; ++i) {
            lastTimeUsec += profile.timeDeltas[i];
            timestamps[i] = lastTimeUsec;
        }
        return timestamps;
    }
    translateProfileTree(nodes) {
        function isNativeNode(node) {
            if (node.callFrame) {
                return Boolean(node.callFrame.url) && node.callFrame.url.startsWith('native ');
            }
            // @ts-ignore Legacy types
            return Boolean(node['url']) && node['url'].startsWith('native ');
        }
        function buildChildrenFromParents(nodes) {
            if (nodes[0].children) {
                return;
            }
            nodes[0].children = [];
            for (let i = 1; i < nodes.length; ++i) {
                const node = nodes[i];
                // @ts-ignore Legacy types
                const parentNode = nodeByIdMap.get(node.parent);
                // @ts-ignore Legacy types
                if (parentNode.children) {
                    // @ts-ignore Legacy types
                    parentNode.children.push(node.id);
                }
                else {
                    // @ts-ignore Legacy types
                    parentNode.children = [node.id];
                }
            }
        }
        function buildHitCountFromSamples(nodes, samples) {
            if (typeof (nodes[0].hitCount) === 'number') {
                return;
            }
            if (!samples) {
                throw new Error('Error: Neither hitCount nor samples are present in profile.');
            }
            for (let i = 0; i < nodes.length; ++i) {
                nodes[i].hitCount = 0;
            }
            for (let i = 0; i < samples.length; ++i) {
                // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
                ++(nodeByIdMap.get(samples[i]).hitCount);
            }
        }
        const nodeByIdMap = new Map();
        for (let i = 0; i < nodes.length; ++i) {
            const node = nodes[i];
            nodeByIdMap.set(node.id, node);
        }
        buildHitCountFromSamples(nodes, this.samples);
        buildChildrenFromParents(nodes);
        this.totalHitCount = nodes.reduce((acc, node) => acc + (node.hitCount || 0), 0);
        const sampleTime = (this.profileEndTime - this.profileStartTime) / this.totalHitCount;
        const keepNatives = true;
        const root = nodes[0];
        const idMap = new Map([[root.id, root.id]]);
        const resultRoot = new CPUProfileNode(root, sampleTime);
        if (!root.children) {
            throw new Error('Missing children for root');
        }
        const parentNodeStack = root.children.map(() => resultRoot);
        const sourceNodeStack = root.children.map(id => nodeByIdMap.get(id));
        while (sourceNodeStack.length) {
            let parentNode = parentNodeStack.pop();
            const sourceNode = sourceNodeStack.pop();
            if (!sourceNode || !parentNode) {
                continue;
            }
            if (!sourceNode.children) {
                sourceNode.children = [];
            }
            const targetNode = new CPUProfileNode(sourceNode, sampleTime);
            if (keepNatives || !isNativeNode(sourceNode)) {
                parentNode.children.push(targetNode);
                parentNode = targetNode;
            }
            else {
                parentNode.self += targetNode.self;
            }
            idMap.set(sourceNode.id, parentNode.id);
            parentNodeStack.push.apply(parentNodeStack, sourceNode.children.map(() => parentNode));
            sourceNodeStack.push.apply(sourceNodeStack, sourceNode.children.map(id => nodeByIdMap.get(id)));
        }
        if (this.samples) {
            this.samples = this.samples.map(id => idMap.get(id));
        }
        return resultRoot;
    }
    sortSamples() {
        const timestamps = this.timestamps;
        if (!timestamps) {
            return;
        }
        const samples = this.samples;
        if (!samples) {
            return;
        }
        const indices = timestamps.map((x, index) => index);
        indices.sort((a, b) => timestamps[a] - timestamps[b]);
        for (let i = 0; i < timestamps.length; ++i) {
            let index = indices[i];
            if (index === i) {
                continue;
            }
            // Move items in a cycle.
            const savedTimestamp = timestamps[i];
            const savedSample = samples[i];
            let currentIndex = i;
            while (index !== i) {
                samples[currentIndex] = samples[index];
                timestamps[currentIndex] = timestamps[index];
                currentIndex = index;
                index = indices[index];
                indices[currentIndex] = currentIndex;
            }
            samples[currentIndex] = savedSample;
            timestamps[currentIndex] = savedTimestamp;
        }
    }
    normalizeTimestamps() {
        if (!this.samples) {
            return;
        }
        let timestamps = this.timestamps;
        if (!timestamps) {
            // Support loading old CPU profiles that are missing timestamps.
            // Derive timestamps from profile start and stop times.
            const profileStartTime = this.profileStartTime;
            const interval = (this.profileEndTime - profileStartTime) / this.samples.length;
            // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            timestamps = new Float64Array(this.samples.length + 1);
            for (let i = 0; i < timestamps.length; ++i) {
                timestamps[i] = profileStartTime + i * interval;
            }
            this.timestamps = timestamps;
            return;
        }
        // Convert samples from usec to msec
        for (let i = 0; i < timestamps.length; ++i) {
            timestamps[i] /= 1000;
        }
        if (this.samples.length === timestamps.length) {
            // Support for a legacy format where were no timeDeltas.
            // Add an extra timestamp used to calculate the last sample duration.
            const averageSample = ((timestamps[timestamps.length - 1] || 0) - timestamps[0]) / (timestamps.length - 1);
            this.timestamps.push((timestamps[timestamps.length - 1] || 0) + averageSample);
        }
        this.profileStartTime = timestamps[0];
        this.profileEndTime = timestamps[timestamps.length - 1];
    }
    buildIdToNodeMap() {
        this.#idToNode = new Map();
        const idToNode = this.#idToNode;
        const stack = [this.profileHead];
        while (stack.length) {
            const node = stack.pop();
            idToNode.set(node.id, node);
            // @ts-ignore Legacy types
            stack.push.apply(stack, node.children);
        }
    }
    extractMetaNodes() {
        const topLevelNodes = this.profileHead.children;
        for (let i = 0; i < topLevelNodes.length && !(this.gcNode && this.programNode && this.idleNode); i++) {
            const node = topLevelNodes[i];
            if (node.functionName === '(garbage collector)') {
                this.gcNode = node;
            }
            else if (node.functionName === '(program)') {
                this.programNode = node;
            }
            else if (node.functionName === '(idle)') {
                this.idleNode = node;
            }
        }
    }
    fixMissingSamples() {
        // Sometimes sampler is not able to parse the JS stack and returns
        // a (program) sample instead. The issue leads to call frames belong
        // to the same function invocation being split apart.
        // Here's a workaround for that. When there's a single (program) sample
        // between two call stacks sharing the same bottom node, it is replaced
        // with the preceeding sample.
        const samples = this.samples;
        if (!samples) {
            return;
        }
        const samplesCount = samples.length;
        if (!this.programNode || samplesCount < 3) {
            return;
        }
        const idToNode = this.#idToNode;
        const programNodeId = this.programNode.id;
        const gcNodeId = this.gcNode ? this.gcNode.id : -1;
        const idleNodeId = this.idleNode ? this.idleNode.id : -1;
        let prevNodeId = samples[0];
        let nodeId = samples[1];
        let count = 0;
        for (let sampleIndex = 1; sampleIndex < samplesCount - 1; sampleIndex++) {
            const nextNodeId = samples[sampleIndex + 1];
            if (nodeId === programNodeId && !isSystemNode(prevNodeId) && !isSystemNode(nextNodeId) &&
                bottomNode(idToNode.get(prevNodeId)) ===
                    bottomNode(idToNode.get(nextNodeId))) {
                ++count;
                samples[sampleIndex] = prevNodeId;
            }
            prevNodeId = nodeId;
            nodeId = nextNodeId;
        }
        function bottomNode(node) {
            while (node.parent && node.parent.parent) {
                node = node.parent;
            }
            return node;
        }
        function isSystemNode(nodeId) {
            return nodeId === programNodeId || nodeId === gcNodeId || nodeId === idleNodeId;
        }
    }
    forEachFrame(openFrameCallback, closeFrameCallback, startTime, stopTime) {
        if (!this.profileHead || !this.samples) {
            return;
        }
        startTime = startTime || 0;
        stopTime = stopTime || Infinity;
        const samples = this.samples;
        const timestamps = this.timestamps;
        const idToNode = this.#idToNode;
        const gcNode = this.gcNode;
        const samplesCount = samples.length;
        const startIndex = (0, array_utilitties_1.lowerBound)(timestamps, startTime, array_utilitties_1.DEFAULT_COMPARATOR);
        let stackTop = 0;
        const stackNodes = [];
        let prevId = this.profileHead.id;
        let sampleTime;
        let gcParentNode = null;
        // Extra slots for gc being put on top,
        // and one at the bottom to allow safe stackTop-1 access.
        const stackDepth = this.maxDepth + 3;
        if (!this.#stackStartTimes) {
            this.#stackStartTimes = new Float64Array(stackDepth);
        }
        const stackStartTimes = this.#stackStartTimes;
        if (!this.#stackChildrenDuration) {
            this.#stackChildrenDuration = new Float64Array(stackDepth);
        }
        const stackChildrenDuration = this.#stackChildrenDuration;
        let node;
        let sampleIndex;
        for (sampleIndex = startIndex; sampleIndex < samplesCount; sampleIndex++) {
            sampleTime = timestamps[sampleIndex];
            if (sampleTime >= stopTime) {
                break;
            }
            const id = samples[sampleIndex];
            if (id === prevId) {
                continue;
            }
            node = idToNode.get(id);
            let prevNode = idToNode.get(prevId);
            if (node === gcNode) {
                // GC samples have no stack, so we just put GC node on top of the last recorded sample.
                gcParentNode = prevNode;
                openFrameCallback(gcParentNode.depth + 1, gcNode, sampleTime);
                stackStartTimes[++stackTop] = sampleTime;
                stackChildrenDuration[stackTop] = 0;
                prevId = id;
                continue;
            }
            if (prevNode === gcNode && gcParentNode) {
                // end of GC frame
                const start = stackStartTimes[stackTop];
                const duration = sampleTime - start;
                stackChildrenDuration[stackTop - 1] += duration;
                closeFrameCallback(gcParentNode.depth + 1, gcNode, start, duration, duration - stackChildrenDuration[stackTop]);
                --stackTop;
                prevNode = gcParentNode;
                prevId = prevNode.id;
                gcParentNode = null;
            }
            while (node && node.depth > prevNode.depth) {
                stackNodes.push(node);
                node = node.parent;
            }
            // Go down to the LCA and close current intervals.
            while (prevNode !== node) {
                const start = stackStartTimes[stackTop];
                const duration = sampleTime - start;
                stackChildrenDuration[stackTop - 1] += duration;
                closeFrameCallback(prevNode.depth, prevNode, start, duration, duration - stackChildrenDuration[stackTop]);
                --stackTop;
                if (node && node.depth === prevNode.depth) {
                    stackNodes.push(node);
                    node = node.parent;
                }
                prevNode = prevNode.parent;
            }
            // Go up the nodes stack and open new intervals.
            while (stackNodes.length) {
                const currentNode = stackNodes.pop();
                node = currentNode;
                openFrameCallback(currentNode.depth, currentNode, sampleTime);
                stackStartTimes[++stackTop] = sampleTime;
                stackChildrenDuration[stackTop] = 0;
            }
            prevId = id;
        }
        sampleTime = timestamps[sampleIndex] || this.profileEndTime;
        if (gcParentNode && idToNode.get(prevId) === gcNode) {
            const start = stackStartTimes[stackTop];
            const duration = sampleTime - start;
            stackChildrenDuration[stackTop - 1] += duration;
            closeFrameCallback(gcParentNode.depth + 1, node, start, duration, duration - stackChildrenDuration[stackTop]);
            --stackTop;
            prevId = gcParentNode.id;
        }
        for (let node = idToNode.get(prevId); node && node.parent; node = node.parent) {
            const start = stackStartTimes[stackTop];
            const duration = sampleTime - start;
            stackChildrenDuration[stackTop - 1] += duration;
            closeFrameCallback(node.depth, node, start, duration, duration - stackChildrenDuration[stackTop]);
            --stackTop;
        }
    }
    nodeByIndex(index) {
        return this.samples && this.#idToNode.get(this.samples[index]) || null;
    }
}
exports.CPUProfileDataModel = CPUProfileDataModel;
//# sourceMappingURL=CPUProfileDataModel.js.map