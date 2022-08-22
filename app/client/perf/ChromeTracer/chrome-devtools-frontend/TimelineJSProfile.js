"use strict";
/* eslint-disable @typescript-eslint/no-namespace */
// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineJSProfileProcessor = void 0;
const TimelineModel_1 = require("./TimelineModel");
const TracingModel_1 = require("./TracingModel");
const UIStrings = {
    /**
     *@description Text for the name of a thread of the page
     *@example {1} PH1
     */
    threadS: "Thread {PH1}",
};
// const str_ = i18n.i18n.registerUIStrings(
//   "models/timeline_model/TimelineJSProfile.ts",
//   UIStrings,
// );
// const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
class TimelineJSProfileProcessor {
    static generateTracingEventsFromCpuProfile(jsProfileModel, thread) {
        const idleNode = jsProfileModel.idleNode;
        const programNode = jsProfileModel.programNode || null;
        const gcNode = jsProfileModel.gcNode;
        const samples = jsProfileModel.samples || [];
        const timestamps = jsProfileModel.timestamps;
        const jsEvents = [];
        const nodeToStackMap = new Map();
        nodeToStackMap.set(programNode, []);
        for (let i = 0; i < samples.length; ++i) {
            let node = jsProfileModel.nodeByIndex(i);
            if (!node) {
                console.error(`Node with unknown id ${samples[i]} at index ${i}`);
                continue;
            }
            if (node === gcNode || node === idleNode) {
                continue;
            }
            let callFrames = nodeToStackMap.get(node);
            if (!callFrames) {
                callFrames = new Array(node.depth + 1);
                nodeToStackMap.set(node, callFrames);
                for (let j = 0; node.parent; node = node.parent) {
                    callFrames[j++] = node;
                }
            }
            const jsSampleEvent = new TracingModel_1.Event(TracingModel_1.DevToolsTimelineEventCategory, TimelineModel_1.RecordType.JSSample, TracingModel_1.Phase.Instant, timestamps[i], thread);
            jsSampleEvent.args["data"] = { stackTrace: callFrames };
            jsEvents.push(jsSampleEvent);
        }
        return jsEvents;
    }
    static generateJSFrameEvents(events, config) {
        function equalFrames(frame1, frame2) {
            return (frame1.scriptId === frame2.scriptId &&
                frame1.functionName === frame2.functionName &&
                frame1.lineNumber === frame2.lineNumber);
        }
        function isJSInvocationEvent(e) {
            switch (e.name) {
                case TimelineModel_1.RecordType.RunMicrotasks:
                case TimelineModel_1.RecordType.FunctionCall:
                case TimelineModel_1.RecordType.EvaluateScript:
                case TimelineModel_1.RecordType.EvaluateModule:
                case TimelineModel_1.RecordType.EventDispatch:
                case TimelineModel_1.RecordType.V8Execute:
                    return true;
            }
            return false;
        }
        const jsFrameEvents = [];
        const jsFramesStack = [];
        const lockedJsStackDepth = [];
        let ordinal = 0;
        let fakeJSInvocation = false;
        const { showAllEvents, showNativeFunctions, showRuntimeCallStats } = config;
        function onStartEvent(e) {
            if (fakeJSInvocation) {
                truncateJSStack(lockedJsStackDepth.pop(), e.startTime);
                fakeJSInvocation = false;
            }
            e.ordinal = ++ordinal;
            extractStackTrace(e);
            // For the duration of the event we cannot go beyond the stack associated with it.
            lockedJsStackDepth.push(jsFramesStack.length);
        }
        function onInstantEvent(e, parent) {
            e.ordinal = ++ordinal;
            if ((parent && isJSInvocationEvent(parent)) || fakeJSInvocation) {
                extractStackTrace(e);
            }
            else if (e.name === TimelineModel_1.RecordType.JSSample && jsFramesStack.length === 0) {
                // Force JS Samples to show up even if we are not inside a JS invocation event, because we
                // can be missing the start of JS invocation events if we start tracing half-way through.
                // Pretend we have a top-level JS invocation event.
                fakeJSInvocation = true;
                const stackDepthBefore = jsFramesStack.length;
                extractStackTrace(e);
                lockedJsStackDepth.push(stackDepthBefore);
            }
        }
        function onEndEvent(e) {
            truncateJSStack(lockedJsStackDepth.pop(), e.endTime);
        }
        function truncateJSStack(depth, time) {
            if (lockedJsStackDepth.length) {
                const lockedDepth = lockedJsStackDepth[lockedJsStackDepth.length - 1];
                if (depth < lockedDepth) {
                    console.error(`Child stack is shallower (${depth}) than the parent stack (${lockedDepth}) at ${time}`);
                    depth = lockedDepth;
                }
            }
            if (jsFramesStack.length < depth) {
                console.error(`Trying to truncate higher than the current stack size at ${time}`);
                depth = jsFramesStack.length;
            }
            for (let k = 0; k < jsFramesStack.length; ++k) {
                jsFramesStack[k].setEndTime(time);
            }
            jsFramesStack.length = depth;
        }
        function showNativeName(name) {
            return (showRuntimeCallStats &&
                Boolean(TimelineJSProfileProcessor.nativeGroup(name)));
        }
        function filterStackFrames(stack) {
            if (showAllEvents) {
                return;
            }
            let previousNativeFrameName = null;
            let j = 0;
            for (let i = 0; i < stack.length; ++i) {
                const frame = stack[i];
                const url = frame.url;
                const isNativeFrame = url && url.startsWith("native ");
                if (!showNativeFunctions && isNativeFrame) {
                    continue;
                }
                const isNativeRuntimeFrame = TimelineJSProfileProcessor.isNativeRuntimeFrame(frame);
                if (isNativeRuntimeFrame && !showNativeName(frame.functionName)) {
                    continue;
                }
                const nativeFrameName = isNativeRuntimeFrame
                    ? TimelineJSProfileProcessor.nativeGroup(frame.functionName)
                    : null;
                if (previousNativeFrameName &&
                    previousNativeFrameName === nativeFrameName) {
                    continue;
                }
                previousNativeFrameName = nativeFrameName;
                stack[j++] = frame;
            }
            stack.length = j;
        }
        function extractStackTrace(e) {
            const callFrames = e.name === TimelineModel_1.RecordType.JSSample
                ? e.args["data"]["stackTrace"].slice().reverse()
                : jsFramesStack.map((frameEvent) => frameEvent.args["data"]);
            filterStackFrames(callFrames);
            const endTime = e.endTime || e.startTime;
            const minFrames = Math.min(callFrames.length, jsFramesStack.length);
            let i;
            for (i = lockedJsStackDepth[lockedJsStackDepth.length - 1] || 0; i < minFrames; ++i) {
                const newFrame = callFrames[i];
                const oldFrame = jsFramesStack[i].args["data"];
                if (!equalFrames(newFrame, oldFrame)) {
                    break;
                }
                jsFramesStack[i].setEndTime(Math.max(jsFramesStack[i].endTime, endTime));
            }
            truncateJSStack(i, e.startTime);
            for (; i < callFrames.length; ++i) {
                const frame = callFrames[i];
                const jsFrameEvent = new TracingModel_1.Event(TracingModel_1.DevToolsTimelineEventCategory, TimelineModel_1.RecordType.JSFrame, TracingModel_1.Phase.Complete, e.startTime, e.thread);
                jsFrameEvent.ordinal = e.ordinal;
                jsFrameEvent.addArgs({ data: frame });
                jsFrameEvent.setEndTime(endTime);
                jsFramesStack.push(jsFrameEvent);
                jsFrameEvents.push(jsFrameEvent);
            }
        }
        const firstTopLevelEvent = events.find(TracingModel_1.TracingModel.isTopLevelEvent);
        const startTime = firstTopLevelEvent ? firstTopLevelEvent.startTime : 0;
        TimelineModel_1.TimelineModelImpl.forEachEvent(events, onStartEvent, onEndEvent, onInstantEvent, startTime);
        return jsFrameEvents;
    }
    static isNativeRuntimeFrame(frame) {
        return frame.url === "native V8Runtime";
    }
    static nativeGroup(nativeName) {
        if (nativeName.startsWith("Parse")) {
            return TimelineJSProfileProcessor.NativeGroups.Parse;
        }
        if (nativeName.startsWith("Compile") ||
            nativeName.startsWith("Recompile")) {
            return TimelineJSProfileProcessor.NativeGroups.Compile;
        }
        return null;
    }
    static buildTraceProfileFromCpuProfile(profile, tid, injectPageEvent, name) {
        const events = [];
        if (injectPageEvent) {
            appendEvent("TracingStartedInPage", { data: { sessionId: "1" } }, 0, 0, "M");
        }
        if (!name) {
            name = UIStrings.threadS + "_tid";
        }
        appendEvent(TracingModel_1.MetadataEvent.ThreadName, { name }, 0, 0, "M", "__metadata");
        if (!profile) {
            return events;
        }
        const idToNode = new Map();
        const nodes = profile["nodes"];
        for (let i = 0; i < nodes.length; ++i) {
            idToNode.set(nodes[i].id, nodes[i]);
        }
        let programEvent = null;
        let functionEvent = null;
        let nextTime = profile.startTime;
        let currentTime = 0;
        const samples = profile["samples"];
        const timeDeltas = profile["timeDeltas"];
        for (let i = 0; i < samples.length; ++i) {
            currentTime = nextTime;
            nextTime += timeDeltas[i];
            const node = idToNode.get(samples[i]);
            const name = node.callFrame.functionName;
            if (name === "(idle)") {
                closeEvents();
                continue;
            }
            if (!programEvent) {
                programEvent = appendEvent("MessageLoop::RunTask", {}, currentTime, 0, "X", "toplevel");
            }
            if (name === "(program)") {
                if (functionEvent) {
                    functionEvent.dur = currentTime - functionEvent.ts;
                    functionEvent = null;
                }
            }
            else {
                // A JS function.
                if (!functionEvent) {
                    functionEvent = appendEvent("FunctionCall", { data: { sessionId: "1" } }, currentTime);
                }
            }
        }
        closeEvents();
        appendEvent("CpuProfile", { data: { cpuProfile: profile } }, profile.endTime, 0, "I");
        return events;
        function closeEvents() {
            if (programEvent) {
                programEvent.dur = currentTime - programEvent.ts;
            }
            if (functionEvent) {
                functionEvent.dur = currentTime - functionEvent.ts;
            }
            programEvent = null;
            functionEvent = null;
        }
        function appendEvent(name, args, ts, dur, ph, cat) {
            const event = {
                cat: cat || "disabled-by-default-devtools.timeline",
                name,
                ph: ph || "X",
                pid: 1,
                tid,
                ts,
                args,
            };
            if (dur) {
                event.dur = dur;
            }
            events.push(event);
            return event;
        }
    }
}
exports.TimelineJSProfileProcessor = TimelineJSProfileProcessor;
(function (TimelineJSProfileProcessor) {
    let NativeGroups;
    (function (NativeGroups) {
        NativeGroups["Compile"] = "Compile";
        NativeGroups["Parse"] = "Parse";
    })(NativeGroups = TimelineJSProfileProcessor.NativeGroups || (TimelineJSProfileProcessor.NativeGroups = {}));
})(TimelineJSProfileProcessor = exports.TimelineJSProfileProcessor || (exports.TimelineJSProfileProcessor = {}));
//# sourceMappingURL=TimelineJSProfile.js.map