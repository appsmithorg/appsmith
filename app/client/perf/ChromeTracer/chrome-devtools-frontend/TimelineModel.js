"use strict";
/* eslint-disable @typescript-eslint/no-namespace */
/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
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
exports.TimelineData = exports.TimelineAsyncEventTracker = exports.InvalidationTracker = exports.InvalidationTrackingEvent = exports.NetworkRequest = exports.AuctionWorklet = exports.PageFrame = exports.TrackType = exports.Track = exports.RecordType = exports.TimelineModelImpl = exports.EmptyUrlString = void 0;
// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
/* eslint-disable @typescript-eslint/no-explicit-any */
const ArrayUtilities = require("./array-utilitties");
const CPUProfileDataModel_1 = require("./CPUProfileDataModel");
// import * as i18n from "./i18n";
// import type * as Protocol from '../../generated/protocol';
const TimelineJSProfile_1 = require("./TimelineJSProfile");
const TracingModel_1 = require("./TracingModel");
class UrlStringTag {
    urlTag;
}
/**
 * File paths in DevTools that are represented as URLs
 * @example
 * “file:///Hello%20World/file/js”
 */
exports.EmptyUrlString = "";
const UIStrings = {
    /**
     *@description Text for the name of a thread of the page
     *@example {1} PH1
     */
    threadS: "Thread {PH1}",
    /**
     *@description Text shown when rendering the User Interactions track in the Performance panel
     */
    userInteractions: "User Interactions",
    /**
     *@description Title of a worker in the timeline flame chart of the Performance panel
     *@example {https://google.com} PH1
     */
    workerS: "`Worker` — {PH1}",
    /**
     *@description Title of a worker in the timeline flame chart of the Performance panel
     */
    dedicatedWorker: "Dedicated `Worker`",
    /**
     *@description Title of a worker in the timeline flame chart of the Performance panel
     *@example {FormatterWorker} PH1
     *@example {https://google.com} PH2
     */
    workerSS: "`Worker`: {PH1} — {PH2}",
    /**
     *@description Title of a bidder auction worklet with known URL in the timeline flame chart of the Performance panel
     *@example {https://google.com} PH1
     */
    bidderWorkletS: "Bidder Worklet — {PH1}",
    /**
     *@description Title of a seller auction worklet with known URL in the timeline flame chart of the Performance panel
     *@example {https://google.com} PH1
     */
    sellerWorkletS: "Seller Worklet — {PH1}",
    /**
     *@description Title of an auction worklet with known URL in the timeline flame chart of the Performance panel
     *@example {https://google.com} PH1
     */
    unknownWorkletS: "Auction Worklet — {PH1}",
    /**
     *@description Title of a bidder auction worklet in the timeline flame chart of the Performance panel
     */
    bidderWorklet: "Bidder Worklet",
    /**
     *@description Title of a seller auction worklet in the timeline flame chart of the Performance panel
     */
    sellerWorklet: "Seller Worklet",
    /**
     *@description Title of an auction worklet in the timeline flame chart of the Performance panel
     */
    unknownWorklet: "Auction Worklet",
    /**
     *@description Title of control thread of a service process for an auction worklet in the timeline flame chart of the Performance panel
     */
    workletService: "Auction Worklet Service",
    /**
     *@description Title of control thread of a service process for an auction worklet with known URL in the timeline flame chart of the Performance panel
     * @example {https://google.com} PH1
     */
    workletServiceS: "Auction Worklet Service — {PH1}",
};
// const str_ = i18n.registerUIStrings(
//   "models/timeline_model/TimelineModel.ts",
//   UIStrings,
// );
// const i18nString = i18n.getLocalizedString.bind(undefined, str_);
class TimelineModelImpl {
    isGenericTraceInternal;
    tracksInternal;
    namedTracks;
    inspectedTargetEventsInternal;
    timeMarkerEventsInternal;
    sessionId;
    mainFrameNodeId;
    pageFrames;
    auctionWorklets;
    cpuProfilesInternal;
    workerIdByThread;
    requestsFromBrowser;
    mainFrame;
    minimumRecordTimeInternal;
    maximumRecordTimeInternal;
    totalBlockingTimeInternal;
    estimatedTotalBlockingTime;
    asyncEventTracker;
    invalidationTracker;
    layoutInvalidate;
    lastScheduleStyleRecalculation;
    paintImageEventByPixelRefId;
    lastPaintForLayer;
    lastRecalculateStylesEvent;
    currentScriptEvent;
    eventStack;
    browserFrameTracking;
    persistentIds;
    legacyCurrentPage;
    currentTaskLayoutAndRecalcEvents;
    tracingModelInternal;
    mainFrameLayerTreeId;
    constructor() {
        this.minimumRecordTimeInternal = 0;
        this.maximumRecordTimeInternal = 0;
        this.totalBlockingTimeInternal = 0;
        this.estimatedTotalBlockingTime = 0;
        this.reset();
        this.resetProcessingState();
        this.currentTaskLayoutAndRecalcEvents = [];
        this.tracingModelInternal = null;
    }
    static forEachEvent(events, onStartEvent, onEndEvent, onInstantEvent, startTime, endTime, filter) {
        startTime = startTime || 0;
        endTime = endTime || Infinity;
        const stack = [];
        const startEvent = TimelineModelImpl.topLevelEventEndingAfter(events, startTime);
        for (let i = startEvent; i < events.length; ++i) {
            const e = events[i];
            if ((e.endTime || e.startTime) < startTime) {
                continue;
            }
            if (e.startTime >= endTime) {
                break;
            }
            if (TracingModel_1.TracingModel.isAsyncPhase(e.phase) ||
                TracingModel_1.TracingModel.isFlowPhase(e.phase)) {
                continue;
            }
            let last = stack[stack.length - 1];
            while (last &&
                last.endTime !== undefined &&
                last.endTime <= e.startTime) {
                stack.pop();
                onEndEvent(last);
                last = stack[stack.length - 1];
            }
            if (filter && !filter(e)) {
                continue;
            }
            if (e.duration) {
                onStartEvent(e);
                stack.push(e);
            }
            else {
                onInstantEvent && onInstantEvent(e, stack[stack.length - 1] || null);
            }
        }
        while (stack.length) {
            const last = stack.pop();
            if (last) {
                onEndEvent(last);
            }
        }
    }
    static topLevelEventEndingAfter(events, time) {
        let index = ArrayUtilities.upperBound(events, time, (time, event) => time - event.startTime) - 1;
        while (index > 0 && !TracingModel_1.TracingModel.isTopLevelEvent(events[index])) {
            index--;
        }
        return Math.max(index, 0);
    }
    isMarkerEvent(event) {
        switch (event.name) {
            case RecordType.TimeStamp:
                return true;
            case RecordType.MarkFirstPaint:
            case RecordType.MarkFCP:
                return (Boolean(this.mainFrame) &&
                    event.args.frame === this.mainFrame.frameId &&
                    Boolean(event.args.data));
            case RecordType.MarkDOMContent:
            case RecordType.MarkLoad:
            case RecordType.MarkLCPCandidate:
            case RecordType.MarkLCPInvalidate:
                return Boolean(event.args["data"]["isOutermostMainFrame"] ??
                    event.args["data"]["isMainFrame"]);
            default:
                return false;
        }
    }
    isInteractiveTimeEvent(event) {
        return event.name === RecordType.InteractiveTime;
    }
    isLayoutShiftEvent(event) {
        return event.name === RecordType.LayoutShift;
    }
    isUserTimingEvent(event) {
        return event.categoriesString === TimelineModelImpl.Category.UserTiming;
    }
    isEventTimingInteractionEvent(event) {
        if (event.name !== RecordType.EventTiming) {
            return false;
        }
        const data = event.args.data;
        // Filter out:
        // 1. events without a duration, or a duration of 0
        // 2. events without an interactionId, or with an interactionId of 0,
        //    which indicates that it's not a "top level" interaction event and
        //    we can therefore ignore it. This can happen with "mousedown" for
        //    example; an interaction ID is assigned to the "pointerdown" event
        //    as it's the "first" event to be triggered when the user clicks,
        //    but the browser doesn't attempt to assign IDs to all subsequent
        //    events, as that's a hard heuristic to get right.
        const duration = data.duration || 0;
        const interactionId = data.interactionId || 0;
        return duration > 0 && interactionId > 0;
    }
    isParseHTMLEvent(event) {
        return event.name === RecordType.ParseHTML;
    }
    isLCPCandidateEvent(event) {
        return (event.name === RecordType.MarkLCPCandidate &&
            Boolean(event.args["data"]["isOutermostMainFrame"] ??
                event.args["data"]["isMainFrame"]));
    }
    isLCPInvalidateEvent(event) {
        return (event.name === RecordType.MarkLCPInvalidate &&
            Boolean(event.args["data"]["isOutermostMainFrame"] ??
                event.args["data"]["isMainFrame"]));
    }
    isFCPEvent(event) {
        return (event.name === RecordType.MarkFCP &&
            Boolean(this.mainFrame) &&
            event.args["frame"] === this.mainFrame.frameId);
    }
    isLongRunningTask(event) {
        return (event.name === RecordType.Task &&
            TimelineData.forEvent(event).warning ===
                TimelineModelImpl.WarningType.LongTask);
    }
    isNavigationStartEvent(event) {
        return event.name === RecordType.NavigationStart;
    }
    isMainFrameNavigationStartEvent(event) {
        return (this.isNavigationStartEvent(event) &&
            (event.args["data"]["isOutermostMainFrame"] ??
                event.args["data"]["isLoadingMainFrame"]) &&
            event.args["data"]["documentLoaderURL"]);
    }
    static globalEventId(event, field) {
        const data = event.args["data"] || event.args["beginData"];
        const id = data && data[field];
        if (!id) {
            return "";
        }
        return `${event.thread.process().id()}.${id}`;
    }
    static eventFrameId(event) {
        const data = event.args["data"] || event.args["beginData"];
        return (data && data["frame"]) || null;
    }
    cpuProfiles() {
        return this.cpuProfilesInternal;
    }
    totalBlockingTime() {
        if (this.totalBlockingTimeInternal === -1) {
            return { time: this.estimatedTotalBlockingTime, estimated: true };
        }
        return { time: this.totalBlockingTimeInternal, estimated: false };
    }
    targetByEvent(event) {
        // FIXME: Consider returning null for loaded traces.
        const workerId = this.workerIdByThread.get(event.thread);
        // const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
        // return workerId
        //   ? SDK.TargetManager.TargetManager.instance().targetById(workerId)
        //   : mainTarget;
        return null;
    }
    navStartTimes() {
        if (!this.tracingModelInternal) {
            return new Map();
        }
        return this.tracingModelInternal.navStartTimes();
    }
    setEvents(tracingModel) {
        this.reset();
        this.resetProcessingState();
        this.tracingModelInternal = tracingModel;
        this.minimumRecordTimeInternal = tracingModel.minimumRecordTime();
        this.maximumRecordTimeInternal = tracingModel.maximumRecordTime();
        // Remove LayoutShift events from the main thread list of events because they are
        // represented in the experience track. This is done prior to the main thread being processed for its own events.
        const layoutShiftEvents = [];
        for (const process of tracingModel.sortedProcesses()) {
            if (process.name() !== "Renderer") {
                continue;
            }
            for (const thread of process.sortedThreads()) {
                const shifts = thread.removeEventsByName(RecordType.LayoutShift);
                layoutShiftEvents.push(...shifts);
            }
        }
        this.processSyncBrowserEvents(tracingModel);
        if (this.browserFrameTracking) {
            this.processThreadsForBrowserFrames(tracingModel);
        }
        else {
            // The next line is for loading legacy traces recorded before M67.
            // TODO(alph): Drop the support at some point.
            const metadataEvents = this.processMetadataEvents(tracingModel);
            this.isGenericTraceInternal = !metadataEvents;
            if (metadataEvents) {
                this.processMetadataAndThreads(tracingModel, metadataEvents);
            }
            else {
                this.processGenericTrace(tracingModel);
            }
        }
        this.inspectedTargetEventsInternal.sort(TracingModel_1.Event.compareStartTime);
        this.processAsyncBrowserEvents(tracingModel);
        this.buildGPUEvents(tracingModel);
        this.buildLoadingEvents(tracingModel, layoutShiftEvents);
        this.collectInteractionEvents(tracingModel);
        this.resetProcessingState();
    }
    collectInteractionEvents(tracingModel) {
        const interactionEvents = [];
        for (const process of tracingModel.sortedProcesses()) {
            // Interactions will only appear on the Renderer processes.
            if (process.name() !== "Renderer") {
                continue;
            }
            // And also only on CrRendererMain threads.
            const rendererThread = process.threadByName("CrRendererMain");
            if (!rendererThread) {
                continue;
            }
            // EventTiming events are async, so we only have to check asyncEvents,
            // and not worry about sync events.
            for (const event of rendererThread.asyncEvents()) {
                if (!this.isEventTimingInteractionEvent(event)) {
                    continue;
                }
                interactionEvents.push(event);
            }
        }
        if (interactionEvents.length === 0) {
            // No events found, so bail early and don't bother creating the track
            // because it will be empty.
            return;
        }
        const track = this.ensureNamedTrack(TrackType.UserInteractions);
        track.name = UIStrings.userInteractions;
        track.forMainFrame = true;
        track.asyncEvents = interactionEvents;
    }
    processGenericTrace(tracingModel) {
        let browserMainThread = TracingModel_1.TracingModel.browserMainThread(tracingModel);
        if (!browserMainThread && tracingModel.sortedProcesses().length) {
            browserMainThread = tracingModel.sortedProcesses()[0].sortedThreads()[0];
        }
        for (const process of tracingModel.sortedProcesses()) {
            for (const thread of process.sortedThreads()) {
                this.processThreadEvents(tracingModel, [{ from: 0, to: Infinity }], thread, thread === browserMainThread, false, true, 0 /* WorkletType.NotWorklet */, null);
            }
        }
    }
    processMetadataAndThreads(tracingModel, metadataEvents) {
        let startTime = 0;
        for (let i = 0, length = metadataEvents.page.length; i < length; i++) {
            const metaEvent = metadataEvents.page[i];
            const process = metaEvent.thread.process();
            const endTime = i + 1 < length ? metadataEvents.page[i + 1].startTime : Infinity;
            if (startTime === endTime) {
                continue;
            }
            this.legacyCurrentPage =
                metaEvent.args["data"] && metaEvent.args["data"]["page"];
            for (const thread of process.sortedThreads()) {
                let workerUrl = null;
                if (thread.name() === TimelineModelImpl.WorkerThreadName ||
                    thread.name() === TimelineModelImpl.WorkerThreadNameLegacy) {
                    const workerMetaEvent = metadataEvents.workers.find((e) => {
                        if (e.args["data"]["workerThreadId"] !== thread.id()) {
                            return false;
                        }
                        // This is to support old traces.
                        if (e.args["data"]["sessionId"] === this.sessionId) {
                            return true;
                        }
                        const frameId = TimelineModelImpl.eventFrameId(e);
                        return frameId ? Boolean(this.pageFrames.get(frameId)) : false;
                    });
                    if (!workerMetaEvent) {
                        continue;
                    }
                    const workerId = workerMetaEvent.args["data"]["workerId"];
                    if (workerId) {
                        this.workerIdByThread.set(thread, workerId);
                    }
                    workerUrl = workerMetaEvent.args["data"]["url"] || exports.EmptyUrlString;
                }
                this.processThreadEvents(tracingModel, [{ from: startTime, to: endTime }], thread, thread === metaEvent.thread, Boolean(workerUrl), true, 0 /* WorkletType.NotWorklet */, workerUrl);
            }
            startTime = endTime;
        }
    }
    processThreadsForBrowserFrames(tracingModel) {
        const processData = new Map();
        for (const frame of this.pageFrames.values()) {
            for (let i = 0; i < frame.processes.length; i++) {
                const pid = frame.processes[i].processId;
                let data = processData.get(pid);
                if (!data) {
                    data = [];
                    processData.set(pid, data);
                }
                const to = i === frame.processes.length - 1
                    ? frame.deletedTime || Infinity
                    : frame.processes[i + 1].time;
                data.push({
                    from: frame.processes[i].time,
                    to: to,
                    main: !frame.parent,
                    url: frame.processes[i].url,
                    workletType: 0 /* WorkletType.NotWorklet */,
                });
            }
        }
        for (const auctionWorklet of this.auctionWorklets.values()) {
            const pid = auctionWorklet.processId;
            let data = processData.get(pid);
            if (!data) {
                data = [];
                processData.set(pid, data);
            }
            data.push({
                from: auctionWorklet.startTime,
                to: auctionWorklet.endTime,
                main: false,
                workletType: auctionWorklet.workletType,
                url: auctionWorklet.host
                    ? ("https://" + auctionWorklet.host)
                    : exports.EmptyUrlString,
            });
        }
        const allMetadataEvents = tracingModel.devToolsMetadataEvents();
        for (const process of tracingModel.sortedProcesses()) {
            const data = processData.get(process.id());
            if (!data) {
                continue;
            }
            data.sort((a, b) => a.from - b.from || a.to - b.to);
            const ranges = [];
            let lastUrl = null;
            let lastMainUrl = null;
            let hasMain = false;
            let allWorklet = true;
            // false: not set, true: inconsistent.
            let workletUrl = false;
            // NotWorklet used for not set.
            let workletType = 0 /* WorkletType.NotWorklet */;
            for (const item of data) {
                const last = ranges[ranges.length - 1];
                if (!last || item.from > last.to) {
                    ranges.push({ from: item.from, to: item.to });
                }
                else {
                    last.to = item.to;
                }
                if (item.main) {
                    hasMain = true;
                }
                if (item.workletType === 0 /* WorkletType.NotWorklet */) {
                    allWorklet = false;
                }
                else {
                    // Update combined workletUrl, checking for inconsistencies.
                    if (workletUrl === false) {
                        workletUrl = item.url;
                    }
                    else if (workletUrl !== item.url) {
                        workletUrl = true; // Process used for different things.
                    }
                    if (workletType === 0 /* WorkletType.NotWorklet */) {
                        workletType = item.workletType;
                    }
                    else if (workletType !== item.workletType) {
                        workletType = 3 /* WorkletType.UnknownWorklet */;
                    }
                }
                if (item.url) {
                    if (item.main) {
                        lastMainUrl = item.url;
                    }
                    lastUrl = item.url;
                }
            }
            for (const thread of process.sortedThreads()) {
                if (thread.name() === TimelineModelImpl.RendererMainThreadName) {
                    this.processThreadEvents(tracingModel, ranges, thread, true /* isMainThread */, false /* isWorker */, hasMain, 0 /* WorkletType.NotWorklet */, hasMain ? lastMainUrl : lastUrl);
                }
                else if (thread.name() === TimelineModelImpl.WorkerThreadName ||
                    thread.name() === TimelineModelImpl.WorkerThreadNameLegacy) {
                    const workerMetaEvent = allMetadataEvents.find((e) => {
                        if (e.name !==
                            TimelineModelImpl.DevToolsMetadataEvent.TracingSessionIdForWorker) {
                            return false;
                        }
                        if (e.thread.process() !== process) {
                            return false;
                        }
                        if (e.args["data"]["workerThreadId"] !== thread.id()) {
                            return false;
                        }
                        const frameId = TimelineModelImpl.eventFrameId(e);
                        return frameId ? Boolean(this.pageFrames.get(frameId)) : false;
                    });
                    if (!workerMetaEvent) {
                        continue;
                    }
                    this.workerIdByThread.set(thread, workerMetaEvent.args["data"]["workerId"] || "");
                    this.processThreadEvents(tracingModel, ranges, thread, false /* isMainThread */, true /* isWorker */, false /* forMainFrame */, 0 /* WorkletType.NotWorklet */, workerMetaEvent.args["data"]["url"] || exports.EmptyUrlString);
                }
                else {
                    let urlForOther = null;
                    let workletTypeForOther = 0 /* WorkletType.NotWorklet */;
                    if (thread.name() === TimelineModelImpl.AuctionWorkletThreadName ||
                        thread.name() === TimelineModelImpl.UtilityMainThreadName) {
                        if (typeof workletUrl !== "boolean") {
                            urlForOther = workletUrl;
                        }
                        workletTypeForOther = workletType;
                    }
                    else {
                        // For processes that only do auction worklet things, skip other threads.
                        if (allWorklet) {
                            continue;
                        }
                    }
                    this.processThreadEvents(tracingModel, ranges, thread, false /* isMainThread */, false /* isWorker */, false /* forMainFrame */, workletTypeForOther, urlForOther);
                }
            }
        }
    }
    processMetadataEvents(tracingModel) {
        const metadataEvents = tracingModel.devToolsMetadataEvents();
        const pageDevToolsMetadataEvents = [];
        const workersDevToolsMetadataEvents = [];
        for (const event of metadataEvents) {
            if (event.name ===
                TimelineModelImpl.DevToolsMetadataEvent.TracingStartedInPage) {
                pageDevToolsMetadataEvents.push(event);
                if (event.args["data"] && event.args["data"]["persistentIds"]) {
                    this.persistentIds = true;
                }
                const frames = (event.args["data"] && event.args["data"]["frames"]) ||
                    [];
                frames.forEach((payload) => this.addPageFrame(event, payload));
                this.mainFrame = this.rootFrames()[0];
            }
            else if (event.name ===
                TimelineModelImpl.DevToolsMetadataEvent.TracingSessionIdForWorker) {
                workersDevToolsMetadataEvents.push(event);
            }
            else if (event.name ===
                TimelineModelImpl.DevToolsMetadataEvent.TracingStartedInBrowser) {
                console.assert(!this.mainFrameNodeId, "Multiple sessions in trace");
                this.mainFrameNodeId = event.args["frameTreeNodeId"];
            }
        }
        if (!pageDevToolsMetadataEvents.length) {
            return null;
        }
        const sessionId = pageDevToolsMetadataEvents[0].args["sessionId"] ||
            pageDevToolsMetadataEvents[0].args["data"]["sessionId"];
        this.sessionId = sessionId;
        const mismatchingIds = new Set();
        function checkSessionId(event) {
            let args = event.args;
            // FIXME: put sessionId into args["data"] for TracingStartedInPage event.
            if (args["data"]) {
                args = args["data"];
            }
            const id = args["sessionId"];
            if (id === sessionId) {
                return true;
            }
            mismatchingIds.add(id);
            return false;
        }
        const result = {
            page: pageDevToolsMetadataEvents
                .filter(checkSessionId)
                .sort(TracingModel_1.Event.compareStartTime),
            workers: workersDevToolsMetadataEvents.sort(TracingModel_1.Event.compareStartTime),
        };
        if (mismatchingIds.size) {
        }
        return result;
    }
    processSyncBrowserEvents(tracingModel) {
        const browserMain = TracingModel_1.TracingModel.browserMainThread(tracingModel);
        if (browserMain) {
            browserMain.events().forEach(this.processBrowserEvent, this);
        }
    }
    processAsyncBrowserEvents(tracingModel) {
        const browserMain = TracingModel_1.TracingModel.browserMainThread(tracingModel);
        if (browserMain) {
            this.processAsyncEvents(browserMain, [{ from: 0, to: Infinity }]);
        }
    }
    buildGPUEvents(tracingModel) {
        const thread = tracingModel.getThreadByName("GPU Process", "CrGpuMain");
        if (!thread) {
            return;
        }
        const gpuEventName = RecordType.GPUTask;
        const track = this.ensureNamedTrack(TrackType.GPU);
        track.thread = thread;
        track.events = thread
            .events()
            .filter((event) => event.name === gpuEventName);
    }
    buildLoadingEvents(tracingModel, events) {
        const thread = tracingModel.getThreadByName("Renderer", "CrRendererMain");
        if (!thread) {
            return;
        }
        const experienceCategory = "experience";
        const track = this.ensureNamedTrack(TrackType.Experience);
        track.thread = thread;
        track.events = events;
        // Even though the event comes from 'loading', in order to color it differently we
        // rename its category.
        for (const trackEvent of track.events) {
            trackEvent.categoriesString = experienceCategory;
            if (trackEvent.name === RecordType.LayoutShift) {
                const eventData = trackEvent.args["data"] || trackEvent.args["beginData"] || {};
                const timelineData = TimelineData.forEvent(trackEvent);
                if (eventData["impacted_nodes"]) {
                    for (let i = 0; i < eventData["impacted_nodes"].length; ++i) {
                        timelineData.backendNodeIds.push(eventData["impacted_nodes"][i]["node_id"]);
                    }
                }
            }
        }
    }
    resetProcessingState() {
        this.asyncEventTracker = new TimelineAsyncEventTracker();
        this.invalidationTracker = new InvalidationTracker();
        this.layoutInvalidate = {};
        this.lastScheduleStyleRecalculation = {};
        this.paintImageEventByPixelRefId = {};
        this.lastPaintForLayer = {};
        this.lastRecalculateStylesEvent = null;
        this.currentScriptEvent = null;
        this.eventStack = [];
        this.browserFrameTracking = false;
        this.persistentIds = false;
        this.legacyCurrentPage = null;
    }
    extractCpuProfile(tracingModel, thread) {
        const events = thread.events();
        let cpuProfile;
        let target = null;
        // Check for legacy CpuProfile event format first.
        let cpuProfileEvent = events[events.length - 1];
        if (cpuProfileEvent && cpuProfileEvent.name === RecordType.CpuProfile) {
            const eventData = cpuProfileEvent.args["data"];
            cpuProfile = eventData && eventData["cpuProfile"];
            target = this.targetByEvent(cpuProfileEvent);
        }
        if (!cpuProfile) {
            cpuProfileEvent = events.find((e) => e.name === RecordType.Profile);
            if (!cpuProfileEvent) {
                return null;
            }
            target = this.targetByEvent(cpuProfileEvent);
            const profileGroup = tracingModel.profileGroup(cpuProfileEvent);
            if (!profileGroup) {
                return null;
            }
            cpuProfile = {
                startTime: cpuProfileEvent.startTime * 1000,
                endTime: 0,
                nodes: [],
                samples: [],
                timeDeltas: [],
                lines: [],
            };
            for (const profileEvent of profileGroup.children) {
                const eventData = profileEvent.args["data"];
                if ("startTime" in eventData) {
                    // Do not use |eventData['startTime']| as it is in CLOCK_MONOTONIC domain,
                    // but use |profileEvent.startTime| (|ts| in the trace event) which has
                    // been translated to Perfetto's clock domain.
                    //
                    // Also convert from ms to us.
                    cpuProfile.startTime = profileEvent.startTime * 1000;
                }
                if ("endTime" in eventData) {
                    // Do not use |eventData['endTime']| as it is in CLOCK_MONOTONIC domain,
                    // but use |profileEvent.startTime| (|ts| in the trace event) which has
                    // been translated to Perfetto's clock domain.
                    //
                    // Despite its name, |profileEvent.startTime| was recorded right after
                    // |eventData['endTime']| within v8 and is a reasonable substitute.
                    //
                    // Also convert from ms to us.
                    cpuProfile.endTime = profileEvent.startTime * 1000;
                }
                const nodesAndSamples = eventData["cpuProfile"] || {};
                const samples = nodesAndSamples["samples"] || [];
                const lines = eventData["lines"] || Array(samples.length).fill(0);
                cpuProfile.nodes.push(...(nodesAndSamples["nodes"] || []));
                cpuProfile.lines.push(...lines);
                if (cpuProfile.samples) {
                    cpuProfile.samples.push(...samples);
                }
                if (cpuProfile.timeDeltas) {
                    cpuProfile.timeDeltas.push(...(eventData["timeDeltas"] || []));
                }
                if (cpuProfile.samples &&
                    cpuProfile.timeDeltas &&
                    cpuProfile.samples.length !== cpuProfile.timeDeltas.length) {
                    return null;
                }
            }
            if (!cpuProfile.endTime && cpuProfile.timeDeltas) {
                const timeDeltas = cpuProfile.timeDeltas;
                cpuProfile.endTime = timeDeltas.reduce((x, y) => x + y, cpuProfile.startTime);
            }
        }
        try {
            const profile = cpuProfile;
            const jsProfileModel = new CPUProfileDataModel_1.CPUProfileDataModel(profile, target);
            this.cpuProfilesInternal.push(jsProfileModel);
            return jsProfileModel;
        }
        catch (e) { }
        return null;
    }
    injectJSFrameEvents(tracingModel, thread) {
        const jsProfileModel = this.extractCpuProfile(tracingModel, thread);
        let events = thread.events();
        const jsSamples = jsProfileModel
            ? TimelineJSProfile_1.TimelineJSProfileProcessor.generateTracingEventsFromCpuProfile(jsProfileModel, thread)
            : null;
        if (jsSamples && jsSamples.length) {
            events = ArrayUtilities.mergeOrdered(events, jsSamples, TracingModel_1.Event.orderedCompareStartTime);
        }
        if (jsSamples || events.some((e) => e.name === RecordType.JSSample)) {
            const jsFrameEvents = TimelineJSProfile_1.TimelineJSProfileProcessor.generateJSFrameEvents(events, {
                showAllEvents: true,
                showRuntimeCallStats: true,
                showNativeFunctions: true,
            });
            if (jsFrameEvents && jsFrameEvents.length) {
                events = ArrayUtilities.mergeOrdered(jsFrameEvents, events, TracingModel_1.Event.orderedCompareStartTime);
            }
        }
        return events;
    }
    static nameAuctionWorklet(workletType, url) {
        switch (workletType) {
            case 1 /* WorkletType.BidderWorklet */:
                return url;
            case 2 /* WorkletType.SellerWorklet */:
                return url;
            default:
                return url;
        }
    }
    processThreadEvents(tracingModel, ranges, thread, isMainThread, isWorker, forMainFrame, workletType, url) {
        const track = new Track();
        track.name = thread.name();
        track.type = TrackType.Other;
        track.thread = thread;
        if (isMainThread) {
            track.type = TrackType.MainThread;
            track.url = url || exports.EmptyUrlString;
            track.forMainFrame = forMainFrame;
        }
        else if (isWorker) {
            track.type = TrackType.Worker;
            track.url = url || exports.EmptyUrlString;
            track.name = track.url;
        }
        else if (thread.name().startsWith("CompositorTileWorker")) {
            track.type = TrackType.Raster;
        }
        else if (thread.name() === TimelineModelImpl.AuctionWorkletThreadName) {
            track.url = url || exports.EmptyUrlString;
            track.name = TimelineModelImpl.nameAuctionWorklet(workletType, url);
        }
        else if (workletType !== 0 /* WorkletType.NotWorklet */ &&
            thread.name() === TimelineModelImpl.UtilityMainThreadName) {
            track.url = url || exports.EmptyUrlString;
            track.name = url;
        }
        this.tracksInternal.push(track);
        const events = this.injectJSFrameEvents(tracingModel, thread);
        this.eventStack = [];
        const eventStack = this.eventStack;
        // Get the worker name from the target.
        if (isWorker) {
            const cpuProfileEvent = events.find((event) => event.name === RecordType.Profile);
            if (cpuProfileEvent) {
                const target = this.targetByEvent(cpuProfileEvent);
                if (target) {
                    track.name = "123";
                }
            }
        }
        for (const range of ranges) {
            let i = ArrayUtilities.lowerBound(events, range.from, (time, event) => time - event.startTime);
            for (; i < events.length; i++) {
                const event = events[i];
                if (event.startTime >= range.to) {
                    break;
                }
                // There may be several TTI events, only take the first one.
                if (this.isInteractiveTimeEvent(event) &&
                    this.totalBlockingTimeInternal === -1) {
                    this.totalBlockingTimeInternal =
                        event.args["args"]["total_blocking_time_ms"];
                }
                const isLongRunningTask = event.name === RecordType.Task &&
                    event.duration &&
                    event.duration > 50;
                if (isMainThread && isLongRunningTask && event.duration) {
                    // We only track main thread events that are over 50ms, and the amount of time in the
                    // event (over 50ms) is what constitutes the blocking time. An event of 70ms, therefore,
                    // contributes 20ms to TBT.
                    this.estimatedTotalBlockingTime += event.duration - 50;
                }
                let last = eventStack[eventStack.length - 1];
                while (last &&
                    last.endTime !== undefined &&
                    last.endTime <= event.startTime) {
                    eventStack.pop();
                    last = eventStack[eventStack.length - 1];
                }
                if (!this.processEvent(event)) {
                    continue;
                }
                if (!TracingModel_1.TracingModel.isAsyncPhase(event.phase) && event.duration) {
                    if (eventStack.length) {
                        const parent = eventStack[eventStack.length - 1];
                        if (parent) {
                            parent.selfTime -= event.duration;
                            if (parent.selfTime < 0) {
                                this.fixNegativeDuration(parent, event);
                            }
                        }
                    }
                    event.selfTime = event.duration;
                    if (!eventStack.length) {
                        track.tasks.push(event);
                    }
                    eventStack.push(event);
                }
                if (this.isMarkerEvent(event)) {
                    this.timeMarkerEventsInternal.push(event);
                }
                track.events.push(event);
                this.inspectedTargetEventsInternal.push(event);
            }
        }
        this.processAsyncEvents(thread, ranges);
    }
    fixNegativeDuration(event, child) {
        const epsilon = 1e-3;
        if (event.selfTime < -epsilon) {
            console.error(`Children are longer than parent at ${event.startTime} ` +
                `(${(child.startTime - this.minimumRecordTime()).toFixed(3)} by ${(-event.selfTime).toFixed(3)}`);
        }
        event.selfTime = 0;
    }
    processAsyncEvents(thread, ranges) {
        const asyncEvents = thread.asyncEvents();
        const groups = new Map();
        function group(type) {
            if (!groups.has(type)) {
                groups.set(type, []);
            }
            return groups.get(type);
        }
        for (const range of ranges) {
            let i = ArrayUtilities.lowerBound(asyncEvents, range.from, function (time, asyncEvent) {
                return time - asyncEvent.startTime;
            });
            for (; i < asyncEvents.length; ++i) {
                const asyncEvent = asyncEvents[i];
                if (asyncEvent.startTime >= range.to) {
                    break;
                }
                if (asyncEvent.hasCategory(TimelineModelImpl.Category.Console)) {
                    group(TrackType.Console).push(asyncEvent);
                    continue;
                }
                if (asyncEvent.hasCategory(TimelineModelImpl.Category.UserTiming)) {
                    group(TrackType.Timings).push(asyncEvent);
                    continue;
                }
                if (asyncEvent.name === RecordType.Animation) {
                    group(TrackType.Animation).push(asyncEvent);
                    continue;
                }
            }
        }
        for (const [type, events] of groups) {
            const track = this.ensureNamedTrack(type);
            track.thread = thread;
            track.asyncEvents = ArrayUtilities.mergeOrdered(track.asyncEvents, events, TracingModel_1.Event.compareStartTime);
        }
    }
    processEvent(event) {
        const eventStack = this.eventStack;
        if (!eventStack.length) {
            if (this.currentTaskLayoutAndRecalcEvents &&
                this.currentTaskLayoutAndRecalcEvents.length) {
                const totalTime = this.currentTaskLayoutAndRecalcEvents.reduce((time, event) => {
                    return event.duration === undefined ? time : time + event.duration;
                }, 0);
                if (totalTime > TimelineModelImpl.Thresholds.ForcedLayout) {
                    for (const e of this.currentTaskLayoutAndRecalcEvents) {
                        const timelineData = TimelineData.forEvent(e);
                        timelineData.warning =
                            e.name === RecordType.Layout
                                ? TimelineModelImpl.WarningType.ForcedLayout
                                : TimelineModelImpl.WarningType.ForcedStyle;
                    }
                }
            }
            this.currentTaskLayoutAndRecalcEvents = [];
        }
        if (this.currentScriptEvent) {
            if (this.currentScriptEvent.endTime !== undefined &&
                event.startTime > this.currentScriptEvent.endTime) {
                this.currentScriptEvent = null;
            }
        }
        const eventData = event.args["data"] || event.args["beginData"] || {};
        const timelineData = TimelineData.forEvent(event);
        if (eventData["stackTrace"]) {
            timelineData.stackTrace = eventData["stackTrace"].map((callFrameOrProfileNode) => {
                // `callFrameOrProfileNode` can also be a `SDK.ProfileTreeModel.ProfileNode` for JSSample; that class
                // has accessors to mimic a `CallFrame`, but apparently we don't adjust stack traces in that case. Whether
                // we should is unclear.
                if (event.name !== RecordType.JSSample) {
                    // We need to copy the data so we can safely modify it below.
                    const frame = { ...callFrameOrProfileNode };
                    // TraceEvents come with 1-based line & column numbers. The frontend code
                    // requires 0-based ones. Adjust the values.
                    --frame.lineNumber;
                    --frame.columnNumber;
                    return frame;
                }
                return callFrameOrProfileNode;
            });
        }
        let pageFrameId = TimelineModelImpl.eventFrameId(event);
        const last = eventStack[eventStack.length - 1];
        if (!pageFrameId && last) {
            pageFrameId = TimelineData.forEvent(last).frameId;
        }
        timelineData.frameId =
            pageFrameId || (this.mainFrame && this.mainFrame.frameId) || "";
        this.asyncEventTracker.processEvent(event);
        if (this.isMarkerEvent(event)) {
            this.ensureNamedTrack(TrackType.Timings);
        }
        switch (event.name) {
            case RecordType.ResourceSendRequest:
            case RecordType.WebSocketCreate: {
                timelineData.setInitiator(eventStack[eventStack.length - 1] || null);
                timelineData.url = eventData["url"];
                break;
            }
            case RecordType.ScheduleStyleRecalculation: {
                this.lastScheduleStyleRecalculation[eventData["frame"]] = event;
                break;
            }
            case RecordType.UpdateLayoutTree:
            case RecordType.RecalculateStyles: {
                this.invalidationTracker.didRecalcStyle(event);
                if (event.args["beginData"]) {
                    timelineData.setInitiator(this.lastScheduleStyleRecalculation[event.args["beginData"]["frame"]]);
                }
                this.lastRecalculateStylesEvent = event;
                if (this.currentScriptEvent) {
                    this.currentTaskLayoutAndRecalcEvents.push(event);
                }
                break;
            }
            case RecordType.ScheduleStyleInvalidationTracking:
            case RecordType.StyleRecalcInvalidationTracking:
            case RecordType.StyleInvalidatorInvalidationTracking:
            case RecordType.LayoutInvalidationTracking: {
                this.invalidationTracker.addInvalidation(new InvalidationTrackingEvent(event, timelineData));
                break;
            }
            case RecordType.InvalidateLayout: {
                // Consider style recalculation as a reason for layout invalidation,
                // but only if we had no earlier layout invalidation records.
                let layoutInitator = event;
                const frameId = eventData["frame"];
                if (!this.layoutInvalidate[frameId] &&
                    this.lastRecalculateStylesEvent &&
                    this.lastRecalculateStylesEvent.endTime !== undefined &&
                    this.lastRecalculateStylesEvent.endTime > event.startTime) {
                    layoutInitator = TimelineData.forEvent(this.lastRecalculateStylesEvent).initiator();
                }
                this.layoutInvalidate[frameId] = layoutInitator;
                break;
            }
            case RecordType.Layout: {
                this.invalidationTracker.didLayout(event);
                const frameId = event.args["beginData"]["frame"];
                timelineData.setInitiator(this.layoutInvalidate[frameId]);
                // In case we have no closing Layout event, endData is not available.
                if (event.args["endData"]) {
                    if (event.args["endData"]["layoutRoots"]) {
                        for (let i = 0; i < event.args["endData"]["layoutRoots"].length; ++i) {
                            timelineData.backendNodeIds.push(event.args["endData"]["layoutRoots"][i]["nodeId"]);
                        }
                    }
                    else {
                        timelineData.backendNodeIds.push(event.args["endData"]["rootNode"]);
                    }
                }
                this.layoutInvalidate[frameId] = null;
                if (this.currentScriptEvent) {
                    this.currentTaskLayoutAndRecalcEvents.push(event);
                }
                break;
            }
            case RecordType.Task: {
                if (event.duration !== undefined &&
                    event.duration > TimelineModelImpl.Thresholds.LongTask) {
                    timelineData.warning = TimelineModelImpl.WarningType.LongTask;
                }
                break;
            }
            case RecordType.EventDispatch: {
                if (event.duration !== undefined &&
                    event.duration > TimelineModelImpl.Thresholds.RecurringHandler) {
                    timelineData.warning = TimelineModelImpl.WarningType.LongHandler;
                }
                break;
            }
            case RecordType.TimerFire:
            case RecordType.FireAnimationFrame: {
                if (event.duration !== undefined &&
                    event.duration > TimelineModelImpl.Thresholds.RecurringHandler) {
                    timelineData.warning =
                        TimelineModelImpl.WarningType.LongRecurringHandler;
                }
                break;
            }
            // @ts-ignore
            case RecordType.FunctionCall: {
                // Compatibility with old format.
                if (typeof eventData["scriptName"] === "string") {
                    eventData["url"] = eventData["scriptName"];
                }
                if (typeof eventData["scriptLine"] === "number") {
                    eventData["lineNumber"] = eventData["scriptLine"];
                }
            }
            case RecordType.EvaluateScript:
            case RecordType.CompileScript:
            // @ts-ignore
            case RecordType.CacheScript: {
                if (typeof eventData["lineNumber"] === "number") {
                    --eventData["lineNumber"];
                }
                if (typeof eventData["columnNumber"] === "number") {
                    --eventData["columnNumber"];
                }
            }
            case RecordType.RunMicrotasks: {
                // Microtasks technically are not necessarily scripts, but for purpose of
                // forced sync style recalc or layout detection they are.
                if (!this.currentScriptEvent) {
                    this.currentScriptEvent = event;
                }
                break;
            }
            case RecordType.SetLayerTreeId: {
                // This is to support old traces.
                if (this.sessionId &&
                    eventData["sessionId"] &&
                    this.sessionId === eventData["sessionId"]) {
                    this.mainFrameLayerTreeId = eventData["layerTreeId"];
                    break;
                }
                // We currently only show layer tree for the main frame.
                const frameId = TimelineModelImpl.eventFrameId(event);
                const pageFrame = frameId ? this.pageFrames.get(frameId) : null;
                if (!pageFrame || pageFrame.parent) {
                    return false;
                }
                this.mainFrameLayerTreeId = eventData["layerTreeId"];
                break;
            }
            case RecordType.Paint: {
                this.invalidationTracker.didPaint = true;
                // With CompositeAfterPaint enabled, paint events are no longer
                // associated with a Node, and nodeId will not be present.
                if ("nodeId" in eventData) {
                    timelineData.backendNodeIds.push(eventData["nodeId"]);
                }
                // Only keep layer paint events, skip paints for subframes that get painted to the same layer as parent.
                if (!eventData["layerId"]) {
                    break;
                }
                const layerId = eventData["layerId"];
                this.lastPaintForLayer[layerId] = event;
                break;
            }
            case RecordType.DisplayItemListSnapshot:
            case RecordType.PictureSnapshot: {
                const layerUpdateEvent = this.findAncestorEvent(RecordType.UpdateLayer);
                if (!layerUpdateEvent ||
                    layerUpdateEvent.args["layerTreeId"] !== this.mainFrameLayerTreeId) {
                    break;
                }
                const paintEvent = this.lastPaintForLayer[layerUpdateEvent.args["layerId"]];
                if (paintEvent) {
                    TimelineData.forEvent(paintEvent).picture = event;
                }
                break;
            }
            case RecordType.ScrollLayer: {
                timelineData.backendNodeIds.push(eventData["nodeId"]);
                break;
            }
            case RecordType.PaintImage: {
                timelineData.backendNodeIds.push(eventData["nodeId"]);
                timelineData.url = eventData["url"];
                break;
            }
            case RecordType.DecodeImage:
            case RecordType.ResizeImage: {
                let paintImageEvent = this.findAncestorEvent(RecordType.PaintImage);
                if (!paintImageEvent) {
                    const decodeLazyPixelRefEvent = this.findAncestorEvent(RecordType.DecodeLazyPixelRef);
                    paintImageEvent =
                        decodeLazyPixelRefEvent &&
                            this.paintImageEventByPixelRefId[decodeLazyPixelRefEvent.args["LazyPixelRef"]];
                }
                if (!paintImageEvent) {
                    break;
                }
                const paintImageData = TimelineData.forEvent(paintImageEvent);
                timelineData.backendNodeIds.push(paintImageData.backendNodeIds[0]);
                timelineData.url = paintImageData.url;
                break;
            }
            case RecordType.DrawLazyPixelRef: {
                const paintImageEvent = this.findAncestorEvent(RecordType.PaintImage);
                if (!paintImageEvent) {
                    break;
                }
                this.paintImageEventByPixelRefId[event.args["LazyPixelRef"]] = paintImageEvent;
                const paintImageData = TimelineData.forEvent(paintImageEvent);
                timelineData.backendNodeIds.push(paintImageData.backendNodeIds[0]);
                timelineData.url = paintImageData.url;
                break;
            }
            case RecordType.FrameStartedLoading: {
                if (timelineData.frameId !== event.args["frame"]) {
                    return false;
                }
                break;
            }
            case RecordType.MarkLCPCandidate: {
                timelineData.backendNodeIds.push(eventData["nodeId"]);
                break;
            }
            case RecordType.MarkDOMContent:
            case RecordType.MarkLoad: {
                const frameId = TimelineModelImpl.eventFrameId(event);
                if (!frameId || !this.pageFrames.has(frameId)) {
                    return false;
                }
                break;
            }
            case RecordType.CommitLoad: {
                if (this.browserFrameTracking) {
                    break;
                }
                const frameId = TimelineModelImpl.eventFrameId(event);
                const isOutermostMainFrame = Boolean(eventData["isOutermostMainFrame"] ?? eventData["isMainFrame"]);
                const pageFrame = frameId ? this.pageFrames.get(frameId) : null;
                if (pageFrame) {
                    pageFrame.update(event.startTime, eventData);
                }
                else {
                    // We should only have one main frame which has persistent id,
                    // unless it's an old trace without 'persistentIds' flag.
                    if (!this.persistentIds) {
                        if (eventData["page"] &&
                            eventData["page"] !== this.legacyCurrentPage) {
                            return false;
                        }
                    }
                    else if (isOutermostMainFrame) {
                        return false;
                    }
                    else if (!this.addPageFrame(event, eventData)) {
                        return false;
                    }
                }
                if (isOutermostMainFrame && frameId) {
                    const frame = this.pageFrames.get(frameId);
                    if (frame) {
                        this.mainFrame = frame;
                    }
                }
                break;
            }
            case RecordType.FireIdleCallback: {
                if (event.duration !== undefined &&
                    event.duration >
                        eventData["allottedMilliseconds"] +
                            TimelineModelImpl.Thresholds.IdleCallbackAddon) {
                    timelineData.warning =
                        TimelineModelImpl.WarningType.IdleDeadlineExceeded;
                }
                break;
            }
        }
        return true;
    }
    processBrowserEvent(event) {
        if (event.name === RecordType.ResourceWillSendRequest) {
            const requestId = event.args?.data?.requestId;
            if (typeof requestId === "string") {
                this.requestsFromBrowser.set(requestId, event);
            }
            return;
        }
        if (event.hasCategory(TracingModel_1.DevToolsMetadataEventCategory) &&
            event.args["data"]) {
            const data = event.args["data"];
            if (event.name ===
                TimelineModelImpl.DevToolsMetadataEvent.TracingStartedInBrowser) {
                if (!data["persistentIds"]) {
                    return;
                }
                this.browserFrameTracking = true;
                this.mainFrameNodeId = data["frameTreeNodeId"];
                const frames = data["frames"] || [];
                frames.forEach((payload) => {
                    const parent = payload["parent"] && this.pageFrames.get(payload["parent"]);
                    if (payload["parent"] && !parent) {
                        return;
                    }
                    let frame = this.pageFrames.get(payload["frame"]);
                    if (!frame) {
                        frame = new PageFrame(payload);
                        this.pageFrames.set(frame.frameId, frame);
                        if (parent) {
                            parent.addChild(frame);
                        }
                        else {
                            this.mainFrame = frame;
                        }
                    }
                    // TODO(dgozman): this should use event.startTime, but due to races between tracing start
                    // in different processes we cannot do this yet.
                    frame.update(this.minimumRecordTimeInternal, payload);
                });
                return;
            }
            if (event.name ===
                TimelineModelImpl.DevToolsMetadataEvent.FrameCommittedInBrowser &&
                this.browserFrameTracking) {
                let frame = this.pageFrames.get(data["frame"]);
                if (!frame) {
                    const parent = data["parent"] && this.pageFrames.get(data["parent"]);
                    if (!parent) {
                        return;
                    }
                    frame = new PageFrame(data);
                    this.pageFrames.set(frame.frameId, frame);
                    parent.addChild(frame);
                }
                frame.update(event.startTime, data);
                return;
            }
            if (event.name ===
                TimelineModelImpl.DevToolsMetadataEvent.ProcessReadyInBrowser &&
                this.browserFrameTracking) {
                const frame = this.pageFrames.get(data["frame"]);
                if (frame) {
                    frame.processReady(data["processPseudoId"], data["processId"]);
                }
                return;
            }
            if (event.name ===
                TimelineModelImpl.DevToolsMetadataEvent.FrameDeletedInBrowser &&
                this.browserFrameTracking) {
                const frame = this.pageFrames.get(data["frame"]);
                if (frame) {
                    frame.deletedTime = event.startTime;
                }
                return;
            }
            if (event.name ===
                TimelineModelImpl.DevToolsMetadataEvent
                    .AuctionWorkletRunningInProcess &&
                this.browserFrameTracking) {
                const worklet = new AuctionWorklet(event, data);
                this.auctionWorklets.set(data["target"], worklet);
            }
            if (event.name ===
                TimelineModelImpl.DevToolsMetadataEvent
                    .AuctionWorkletDoneWithProcess &&
                this.browserFrameTracking) {
                const worklet = this.auctionWorklets.get(data["target"]);
                if (worklet) {
                    worklet.endTime = event.startTime;
                }
            }
        }
    }
    ensureNamedTrack(type) {
        let track = this.namedTracks.get(type);
        if (track) {
            return track;
        }
        track = new Track();
        track.type = type;
        this.tracksInternal.push(track);
        this.namedTracks.set(type, track);
        return track;
    }
    findAncestorEvent(name) {
        for (let i = this.eventStack.length - 1; i >= 0; --i) {
            const event = this.eventStack[i];
            if (event.name === name) {
                return event;
            }
        }
        return null;
    }
    addPageFrame(event, payload) {
        const parent = payload["parent"] && this.pageFrames.get(payload["parent"]);
        if (payload["parent"] && !parent) {
            return false;
        }
        const pageFrame = new PageFrame(payload);
        this.pageFrames.set(pageFrame.frameId, pageFrame);
        pageFrame.update(event.startTime, payload);
        if (parent) {
            parent.addChild(pageFrame);
        }
        return true;
    }
    reset() {
        this.isGenericTraceInternal = false;
        this.tracksInternal = [];
        this.namedTracks = new Map();
        this.inspectedTargetEventsInternal = [];
        this.timeMarkerEventsInternal = [];
        this.sessionId = null;
        this.mainFrameNodeId = null;
        this.cpuProfilesInternal = [];
        this.workerIdByThread = new WeakMap();
        this.pageFrames = new Map();
        this.auctionWorklets = new Map();
        this.requestsFromBrowser = new Map();
        this.minimumRecordTimeInternal = 0;
        this.maximumRecordTimeInternal = 0;
        this.totalBlockingTimeInternal = -1;
        this.estimatedTotalBlockingTime = 0;
    }
    isGenericTrace() {
        return this.isGenericTraceInternal;
    }
    tracingModel() {
        return this.tracingModelInternal;
    }
    minimumRecordTime() {
        return this.minimumRecordTimeInternal;
    }
    maximumRecordTime() {
        return this.maximumRecordTimeInternal;
    }
    inspectedTargetEvents() {
        return this.inspectedTargetEventsInternal;
    }
    tracks() {
        return this.tracksInternal;
    }
    isEmpty() {
        return this.minimumRecordTime() === 0 && this.maximumRecordTime() === 0;
    }
    timeMarkerEvents() {
        return this.timeMarkerEventsInternal;
    }
    rootFrames() {
        return Array.from(this.pageFrames.values()).filter((frame) => !frame.parent);
    }
    pageURL() {
        return (this.mainFrame && this.mainFrame.url) || exports.EmptyUrlString;
    }
    pageFrameById(frameId) {
        return frameId ? this.pageFrames.get(frameId) || null : null;
    }
    networkRequests() {
        if (this.isGenericTrace()) {
            return [];
        }
        const requests = new Map();
        const requestsList = [];
        const zeroStartRequestsList = [];
        const resourceTypes = new Set([
            RecordType.ResourceWillSendRequest,
            RecordType.ResourceSendRequest,
            RecordType.ResourceReceiveResponse,
            RecordType.ResourceReceivedData,
            RecordType.ResourceFinish,
            RecordType.ResourceMarkAsCached,
        ]);
        const events = this.inspectedTargetEvents();
        for (let i = 0; i < events.length; ++i) {
            const e = events[i];
            if (!resourceTypes.has(e.name)) {
                continue;
            }
            const id = TimelineModelImpl.globalEventId(e, "requestId");
            const requestId = e.args?.data?.requestId;
            if (e.name === RecordType.ResourceSendRequest &&
                requestId &&
                this.requestsFromBrowser.has(requestId)) {
                const event = this.requestsFromBrowser.get(requestId);
                if (event) {
                    addRequest(event, id);
                }
            }
            addRequest(e, id);
        }
        function addRequest(e, id) {
            let request = requests.get(id);
            if (request) {
                request.addEvent(e);
            }
            else {
                request = new NetworkRequest(e);
                requests.set(id, request);
                if (request.startTime) {
                    requestsList.push(request);
                }
                else {
                    zeroStartRequestsList.push(request);
                }
            }
        }
        return zeroStartRequestsList.concat(requestsList);
    }
}
exports.TimelineModelImpl = TimelineModelImpl;
// TODO(crbug.com/1167717): Make this a const enum again
var RecordType;
(function (RecordType) {
    RecordType["Task"] = "RunTask";
    RecordType["Program"] = "Program";
    RecordType["EventDispatch"] = "EventDispatch";
    RecordType["GPUTask"] = "GPUTask";
    RecordType["Animation"] = "Animation";
    RecordType["RequestMainThreadFrame"] = "RequestMainThreadFrame";
    RecordType["BeginFrame"] = "BeginFrame";
    RecordType["NeedsBeginFrameChanged"] = "NeedsBeginFrameChanged";
    RecordType["BeginMainThreadFrame"] = "BeginMainThreadFrame";
    RecordType["ActivateLayerTree"] = "ActivateLayerTree";
    RecordType["DrawFrame"] = "DrawFrame";
    RecordType["DroppedFrame"] = "DroppedFrame";
    RecordType["HitTest"] = "HitTest";
    RecordType["ScheduleStyleRecalculation"] = "ScheduleStyleRecalculation";
    RecordType["RecalculateStyles"] = "RecalculateStyles";
    RecordType["UpdateLayoutTree"] = "UpdateLayoutTree";
    RecordType["InvalidateLayout"] = "InvalidateLayout";
    RecordType["Layout"] = "Layout";
    RecordType["LayoutShift"] = "LayoutShift";
    RecordType["UpdateLayer"] = "UpdateLayer";
    RecordType["UpdateLayerTree"] = "UpdateLayerTree";
    RecordType["PaintSetup"] = "PaintSetup";
    RecordType["Paint"] = "Paint";
    RecordType["PaintImage"] = "PaintImage";
    RecordType["PrePaint"] = "PrePaint";
    RecordType["Rasterize"] = "Rasterize";
    RecordType["RasterTask"] = "RasterTask";
    RecordType["ScrollLayer"] = "ScrollLayer";
    RecordType["CompositeLayers"] = "CompositeLayers";
    RecordType["ComputeIntersections"] = "IntersectionObserverController::computeIntersections";
    RecordType["InteractiveTime"] = "InteractiveTime";
    RecordType["ScheduleStyleInvalidationTracking"] = "ScheduleStyleInvalidationTracking";
    RecordType["StyleRecalcInvalidationTracking"] = "StyleRecalcInvalidationTracking";
    RecordType["StyleInvalidatorInvalidationTracking"] = "StyleInvalidatorInvalidationTracking";
    RecordType["LayoutInvalidationTracking"] = "LayoutInvalidationTracking";
    RecordType["ParseHTML"] = "ParseHTML";
    RecordType["ParseAuthorStyleSheet"] = "ParseAuthorStyleSheet";
    RecordType["TimerInstall"] = "TimerInstall";
    RecordType["TimerRemove"] = "TimerRemove";
    RecordType["TimerFire"] = "TimerFire";
    RecordType["XHRReadyStateChange"] = "XHRReadyStateChange";
    RecordType["XHRLoad"] = "XHRLoad";
    RecordType["CompileScript"] = "v8.compile";
    RecordType["CompileCode"] = "V8.CompileCode";
    RecordType["OptimizeCode"] = "V8.OptimizeCode";
    RecordType["EvaluateScript"] = "EvaluateScript";
    RecordType["CacheScript"] = "v8.produceCache";
    RecordType["CompileModule"] = "v8.compileModule";
    RecordType["EvaluateModule"] = "v8.evaluateModule";
    RecordType["CacheModule"] = "v8.produceModuleCache";
    RecordType["WasmStreamFromResponseCallback"] = "v8.wasm.streamFromResponseCallback";
    RecordType["WasmCompiledModule"] = "v8.wasm.compiledModule";
    RecordType["WasmCachedModule"] = "v8.wasm.cachedModule";
    RecordType["WasmModuleCacheHit"] = "v8.wasm.moduleCacheHit";
    RecordType["WasmModuleCacheInvalid"] = "v8.wasm.moduleCacheInvalid";
    RecordType["FrameStartedLoading"] = "FrameStartedLoading";
    RecordType["CommitLoad"] = "CommitLoad";
    RecordType["MarkLoad"] = "MarkLoad";
    RecordType["MarkDOMContent"] = "MarkDOMContent";
    RecordType["MarkFirstPaint"] = "firstPaint";
    RecordType["MarkFCP"] = "firstContentfulPaint";
    RecordType["MarkLCPCandidate"] = "largestContentfulPaint::Candidate";
    RecordType["MarkLCPInvalidate"] = "largestContentfulPaint::Invalidate";
    RecordType["NavigationStart"] = "navigationStart";
    RecordType["TimeStamp"] = "TimeStamp";
    RecordType["ConsoleTime"] = "ConsoleTime";
    RecordType["UserTiming"] = "UserTiming";
    RecordType["EventTiming"] = "EventTiming";
    RecordType["ResourceWillSendRequest"] = "ResourceWillSendRequest";
    RecordType["ResourceSendRequest"] = "ResourceSendRequest";
    RecordType["ResourceReceiveResponse"] = "ResourceReceiveResponse";
    RecordType["ResourceReceivedData"] = "ResourceReceivedData";
    RecordType["ResourceFinish"] = "ResourceFinish";
    RecordType["ResourceMarkAsCached"] = "ResourceMarkAsCached";
    RecordType["RunMicrotasks"] = "RunMicrotasks";
    RecordType["FunctionCall"] = "FunctionCall";
    RecordType["GCEvent"] = "GCEvent";
    RecordType["MajorGC"] = "MajorGC";
    RecordType["MinorGC"] = "MinorGC";
    RecordType["JSFrame"] = "JSFrame";
    RecordType["JSSample"] = "JSSample";
    // V8Sample events are coming from tracing and contain raw stacks with function addresses.
    // After being processed with help of JitCodeAdded and JitCodeMoved events they
    // get translated into function infos and stored as stacks in JSSample events.
    RecordType["V8Sample"] = "V8Sample";
    RecordType["JitCodeAdded"] = "JitCodeAdded";
    RecordType["JitCodeMoved"] = "JitCodeMoved";
    RecordType["StreamingCompileScript"] = "v8.parseOnBackground";
    RecordType["StreamingCompileScriptWaiting"] = "v8.parseOnBackgroundWaiting";
    RecordType["StreamingCompileScriptParsing"] = "v8.parseOnBackgroundParsing";
    RecordType["V8Execute"] = "V8.Execute";
    RecordType["UpdateCounters"] = "UpdateCounters";
    RecordType["RequestAnimationFrame"] = "RequestAnimationFrame";
    RecordType["CancelAnimationFrame"] = "CancelAnimationFrame";
    RecordType["FireAnimationFrame"] = "FireAnimationFrame";
    RecordType["RequestIdleCallback"] = "RequestIdleCallback";
    RecordType["CancelIdleCallback"] = "CancelIdleCallback";
    RecordType["FireIdleCallback"] = "FireIdleCallback";
    RecordType["WebSocketCreate"] = "WebSocketCreate";
    RecordType["WebSocketSendHandshakeRequest"] = "WebSocketSendHandshakeRequest";
    RecordType["WebSocketReceiveHandshakeResponse"] = "WebSocketReceiveHandshakeResponse";
    RecordType["WebSocketDestroy"] = "WebSocketDestroy";
    RecordType["EmbedderCallback"] = "EmbedderCallback";
    RecordType["SetLayerTreeId"] = "SetLayerTreeId";
    RecordType["TracingStartedInPage"] = "TracingStartedInPage";
    RecordType["TracingSessionIdForWorker"] = "TracingSessionIdForWorker";
    RecordType["DecodeImage"] = "Decode Image";
    RecordType["ResizeImage"] = "Resize Image";
    RecordType["DrawLazyPixelRef"] = "Draw LazyPixelRef";
    RecordType["DecodeLazyPixelRef"] = "Decode LazyPixelRef";
    RecordType["LazyPixelRef"] = "LazyPixelRef";
    RecordType["LayerTreeHostImplSnapshot"] = "cc::LayerTreeHostImpl";
    RecordType["PictureSnapshot"] = "cc::Picture";
    RecordType["DisplayItemListSnapshot"] = "cc::DisplayItemList";
    RecordType["LatencyInfo"] = "LatencyInfo";
    RecordType["LatencyInfoFlow"] = "LatencyInfo.Flow";
    RecordType["InputLatencyMouseMove"] = "InputLatency::MouseMove";
    RecordType["InputLatencyMouseWheel"] = "InputLatency::MouseWheel";
    RecordType["ImplSideFling"] = "InputHandlerProxy::HandleGestureFling::started";
    RecordType["GCCollectGarbage"] = "BlinkGC.AtomicPhase";
    RecordType["CryptoDoEncrypt"] = "DoEncrypt";
    RecordType["CryptoDoEncryptReply"] = "DoEncryptReply";
    RecordType["CryptoDoDecrypt"] = "DoDecrypt";
    RecordType["CryptoDoDecryptReply"] = "DoDecryptReply";
    RecordType["CryptoDoDigest"] = "DoDigest";
    RecordType["CryptoDoDigestReply"] = "DoDigestReply";
    RecordType["CryptoDoSign"] = "DoSign";
    RecordType["CryptoDoSignReply"] = "DoSignReply";
    RecordType["CryptoDoVerify"] = "DoVerify";
    RecordType["CryptoDoVerifyReply"] = "DoVerifyReply";
    // CpuProfile is a virtual event created on frontend to support
    // serialization of CPU Profiles within tracing timeline data.
    RecordType["CpuProfile"] = "CpuProfile";
    RecordType["Profile"] = "Profile";
    RecordType["AsyncTask"] = "AsyncTask";
})(RecordType = exports.RecordType || (exports.RecordType = {}));
(function (TimelineModelImpl) {
    TimelineModelImpl.Category = {
        Console: "blink.console",
        UserTiming: "blink.user_timing",
        LatencyInfo: "latencyInfo",
        Loading: "loading",
    };
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    let WarningType;
    (function (WarningType) {
        WarningType["LongTask"] = "LongTask";
        WarningType["ForcedStyle"] = "ForcedStyle";
        WarningType["ForcedLayout"] = "ForcedLayout";
        WarningType["IdleDeadlineExceeded"] = "IdleDeadlineExceeded";
        WarningType["LongHandler"] = "LongHandler";
        WarningType["LongRecurringHandler"] = "LongRecurringHandler";
        WarningType["V8Deopt"] = "V8Deopt";
    })(WarningType = TimelineModelImpl.WarningType || (TimelineModelImpl.WarningType = {}));
    TimelineModelImpl.WorkerThreadName = "DedicatedWorker thread";
    TimelineModelImpl.WorkerThreadNameLegacy = "DedicatedWorker Thread";
    TimelineModelImpl.RendererMainThreadName = "CrRendererMain";
    TimelineModelImpl.BrowserMainThreadName = "CrBrowserMain";
    TimelineModelImpl.UtilityMainThreadName = "CrUtilityMain";
    TimelineModelImpl.AuctionWorkletThreadName = "AuctionV8HelperThread";
    TimelineModelImpl.DevToolsMetadataEvent = {
        TracingStartedInBrowser: "TracingStartedInBrowser",
        TracingStartedInPage: "TracingStartedInPage",
        TracingSessionIdForWorker: "TracingSessionIdForWorker",
        FrameCommittedInBrowser: "FrameCommittedInBrowser",
        ProcessReadyInBrowser: "ProcessReadyInBrowser",
        FrameDeletedInBrowser: "FrameDeletedInBrowser",
        AuctionWorkletRunningInProcess: "AuctionWorkletRunningInProcess",
        AuctionWorkletDoneWithProcess: "AuctionWorkletDoneWithProcess",
    };
    TimelineModelImpl.Thresholds = {
        LongTask: 50,
        Handler: 150,
        RecurringHandler: 50,
        ForcedLayout: 30,
        IdleCallbackAddon: 5,
    };
})(TimelineModelImpl = exports.TimelineModelImpl || (exports.TimelineModelImpl = {}));
class Track {
    name;
    type;
    forMainFrame;
    url;
    events;
    asyncEvents;
    tasks;
    syncEventsInternal;
    thread;
    constructor() {
        this.name = "";
        this.type = TrackType.Other;
        // TODO(dgozman): replace forMainFrame with a list of frames, urls and time ranges.
        this.forMainFrame = false;
        this.url = exports.EmptyUrlString;
        // TODO(dgozman): do not distinguish between sync and async events.
        this.events = [];
        this.asyncEvents = [];
        this.tasks = [];
        this.syncEventsInternal = null;
        this.thread = null;
    }
    syncEvents() {
        if (this.events.length) {
            return this.events;
        }
        if (this.syncEventsInternal) {
            return this.syncEventsInternal;
        }
        const stack = [];
        function peekLastEndTime() {
            const last = stack[stack.length - 1];
            if (last !== undefined) {
                const endTime = last.endTime;
                if (endTime !== undefined) {
                    return endTime;
                }
            }
            throw new Error("End time does not exist on event.");
        }
        this.syncEventsInternal = [];
        for (const event of this.asyncEvents) {
            const startTime = event.startTime;
            let endTime = event.endTime;
            if (endTime === undefined) {
                endTime = startTime;
            }
            while (stack.length && startTime >= peekLastEndTime()) {
                stack.pop();
            }
            if (stack.length && endTime > peekLastEndTime()) {
                this.syncEventsInternal = [];
                break;
            }
            const syncEvent = new TracingModel_1.Event(event.categoriesString, event.name, TracingModel_1.Phase.Complete, startTime, event.thread);
            syncEvent.setEndTime(endTime);
            syncEvent.addArgs(event.args);
            this.syncEventsInternal.push(syncEvent);
            stack.push(syncEvent);
        }
        return this.syncEventsInternal;
    }
}
exports.Track = Track;
// TODO(crbug.com/1167717): Make this a const enum again
var TrackType;
(function (TrackType) {
    TrackType["MainThread"] = "MainThread";
    TrackType["Worker"] = "Worker";
    TrackType["Animation"] = "Animation";
    TrackType["Timings"] = "Timings";
    TrackType["Console"] = "Console";
    TrackType["Raster"] = "Raster";
    TrackType["GPU"] = "GPU";
    TrackType["Experience"] = "Experience";
    TrackType["Other"] = "Other";
    TrackType["UserInteractions"] = "UserInteractions";
})(TrackType = exports.TrackType || (exports.TrackType = {}));
class PageFrame {
    frameId;
    url;
    name;
    children;
    parent;
    processes;
    deletedTime;
    ownerNode;
    constructor(payload) {
        this.frameId = payload["frame"];
        this.url = payload["url"] || exports.EmptyUrlString;
        this.name = payload["name"];
        this.children = [];
        this.parent = null;
        this.processes = [];
        this.deletedTime = null;
        // TODO(dgozman): figure this out.
        // this.ownerNode = target && payload['nodeId'] ? new SDK.DOMModel.DeferredDOMNode(target, payload['nodeId']) : null;
        this.ownerNode = null;
    }
    update(time, payload) {
        this.url = payload["url"] || "";
        this.name = payload["name"];
        if (payload["processId"]) {
            this.processes.push({
                time: time,
                processId: payload["processId"],
                processPseudoId: "",
                url: payload["url"] || "",
            });
        }
        else {
            this.processes.push({
                time: time,
                processId: -1,
                processPseudoId: payload["processPseudoId"],
                url: payload["url"] || "",
            });
        }
    }
    processReady(processPseudoId, processId) {
        for (const process of this.processes) {
            if (process.processPseudoId === processPseudoId) {
                process.processPseudoId = "";
                process.processId = processId;
            }
        }
    }
    addChild(child) {
        this.children.push(child);
        child.parent = this;
    }
}
exports.PageFrame = PageFrame;
class AuctionWorklet {
    targetId;
    processId;
    host;
    startTime;
    endTime;
    workletType;
    constructor(event, data) {
        this.targetId = typeof data["target"] === "string" ? data["target"] : "";
        this.processId = typeof data["pid"] === "number" ? data["pid"] : 0;
        this.host = typeof data["host"] === "string" ? data["host"] : undefined;
        this.startTime = event.startTime;
        this.endTime = Infinity;
        if (data["type"] === "bidder") {
            this.workletType = 1 /* WorkletType.BidderWorklet */;
        }
        else if (data["type"] === "seller") {
            this.workletType = 2 /* WorkletType.SellerWorklet */;
        }
        else {
            this.workletType = 3 /* WorkletType.UnknownWorklet */;
        }
    }
}
exports.AuctionWorklet = AuctionWorklet;
class NetworkRequest {
    startTime;
    endTime;
    encodedDataLength;
    decodedBodyLength;
    children;
    timing;
    mimeType;
    url;
    requestMethod;
    transferSize;
    maybeDiskCached;
    memoryCachedInternal;
    priority;
    finishTime;
    responseTime;
    fromServiceWorker;
    hasCachedResource;
    constructor(event) {
        const isInitial = event.name === RecordType.ResourceSendRequest ||
            event.name === RecordType.ResourceWillSendRequest;
        this.startTime = isInitial ? event.startTime : 0;
        this.endTime = Infinity;
        this.encodedDataLength = 0;
        this.decodedBodyLength = 0;
        this.children = [];
        this.transferSize = 0;
        this.maybeDiskCached = false;
        this.memoryCachedInternal = false;
        this.addEvent(event);
    }
    addEvent(event) {
        this.children.push(event);
        // This Math.min is likely because of BUG(chromium:865066).
        this.startTime = Math.min(this.startTime, event.startTime);
        const eventData = event.args["data"];
        if (eventData["mimeType"]) {
            this.mimeType = eventData["mimeType"];
        }
        if ("priority" in eventData) {
            this.priority = eventData["priority"];
        }
        if (event.name === RecordType.ResourceFinish) {
            this.endTime = event.startTime;
        }
        if (eventData["finishTime"]) {
            this.finishTime = eventData["finishTime"] * 1000;
        }
        if (!this.responseTime &&
            (event.name === RecordType.ResourceReceiveResponse ||
                event.name === RecordType.ResourceReceivedData)) {
            this.responseTime = event.startTime;
        }
        const encodedDataLength = eventData["encodedDataLength"] || 0;
        if (event.name === RecordType.ResourceMarkAsCached) {
            // This is a reliable signal for memory caching.
            this.memoryCachedInternal = true;
        }
        if (event.name === RecordType.ResourceReceiveResponse) {
            if (eventData["fromCache"]) {
                // See BUG(chromium:998397): back-end over-approximates caching.
                this.maybeDiskCached = true;
            }
            if (eventData["fromServiceWorker"]) {
                this.fromServiceWorker = true;
            }
            if (eventData["hasCachedResource"]) {
                this.hasCachedResource = true;
            }
            this.encodedDataLength = encodedDataLength;
        }
        if (event.name === RecordType.ResourceReceivedData) {
            this.encodedDataLength += encodedDataLength;
        }
        if (event.name === RecordType.ResourceFinish && encodedDataLength) {
            this.encodedDataLength = encodedDataLength;
            // If a ResourceFinish event with an encoded data length is received,
            // then the resource was not cached; it was fetched before it was
            // requested, e.g. because it was pushed in this navigation.
            this.transferSize = encodedDataLength;
        }
        const decodedBodyLength = eventData["decodedBodyLength"];
        if (event.name === RecordType.ResourceFinish && decodedBodyLength) {
            this.decodedBodyLength = decodedBodyLength;
        }
        if (!this.url) {
            this.url = eventData["url"];
        }
        if (!this.requestMethod) {
            this.requestMethod = eventData["requestMethod"];
        }
        if (!this.timing) {
            this.timing = eventData["timing"];
        }
        if (eventData["fromServiceWorker"]) {
            this.fromServiceWorker = true;
        }
    }
    /**
     * Return whether this request was cached. This works around BUG(chromium:998397),
     * which reports pushed resources, and resources serverd by a service worker as
     * disk cached. Pushed resources that were not disk cached, however, have a non-zero
     * `transferSize`.
     */
    cached() {
        return (Boolean(this.memoryCachedInternal) ||
            (Boolean(this.maybeDiskCached) &&
                !this.transferSize &&
                !this.fromServiceWorker));
    }
    /**
     * Return whether this request was served from a memory cache.
     */
    memoryCached() {
        return this.memoryCachedInternal;
    }
    /**
     * Get the timing information for this request. If the request was cached,
     * the timing refers to the original (uncached) load, and should not be used.
     */
    getSendReceiveTiming() {
        if (this.cached() || !this.timing) {
            // If the request is served from cache, the timing refers to the original
            // resource load, and should not be used.
            return { sendStartTime: this.startTime, headersEndTime: this.startTime };
        }
        const requestTime = this.timing.requestTime * 1000;
        const sendStartTime = requestTime + this.timing.sendStart;
        const headersEndTime = requestTime + this.timing.receiveHeadersEnd;
        return { sendStartTime, headersEndTime };
    }
    /**
     * Get the start time of this request, i.e. the time when the browser or
     * renderer queued this request. There are two cases where request time is
     * earlier than `startTime`: (1) if the request is served from cache, because
     * it refers to the original load of the resource. (2) if the request was
     * initiated by the browser instead of the renderer. Only in case (2) the
     * the request time must be used instead of the start time to work around
     * BUG(chromium:865066).
     */
    getStartTime() {
        return Math.min(this.startTime, (!this.cached() && this.timing && this.timing.requestTime * 1000) ||
            Infinity);
    }
    /**
     * Returns the time where the earliest event belonging to this request starts.
     * This differs from `getStartTime()` if a previous HTTP/2 request pushed the
     * resource proactively: Then `beginTime()` refers to the time the push was received.
     */
    beginTime() {
        // `pushStart` is referring to the original push if the request was cached (i.e. in
        // general not the most recent push), and should hence only be used for requests that were not cached.
        return Math.min(this.getStartTime(), (!this.cached() && this.timing && this.timing.pushStart * 1000) ||
            Infinity);
    }
}
exports.NetworkRequest = NetworkRequest;
class InvalidationTrackingEvent {
    type;
    startTime;
    tracingEvent;
    frame;
    nodeId;
    nodeName;
    invalidationSet;
    invalidatedSelectorId;
    changedId;
    changedClass;
    changedAttribute;
    changedPseudo;
    selectorPart;
    extraData;
    invalidationList;
    cause;
    linkedRecalcStyleEvent;
    linkedLayoutEvent;
    constructor(event, timelineData) {
        this.type = event.name;
        this.startTime = event.startTime;
        this.tracingEvent = event;
        const eventData = event.args["data"];
        this.frame = eventData["frame"];
        this.nodeId = eventData["nodeId"];
        this.nodeName = eventData["nodeName"];
        this.invalidationSet = eventData["invalidationSet"];
        this.invalidatedSelectorId = eventData["invalidatedSelectorId"];
        this.changedId = eventData["changedId"];
        this.changedClass = eventData["changedClass"];
        this.changedAttribute = eventData["changedAttribute"];
        this.changedPseudo = eventData["changedPseudo"];
        this.selectorPart = eventData["selectorPart"];
        this.extraData = eventData["extraData"];
        this.invalidationList = eventData["invalidationList"];
        this.cause = {
            reason: eventData["reason"],
            stackTrace: timelineData.stackTrace,
        };
        this.linkedRecalcStyleEvent = false;
        this.linkedLayoutEvent = false;
        // FIXME: Move this to TimelineUIUtils.js.
        if (!this.cause.reason &&
            this.cause.stackTrace &&
            this.type === RecordType.LayoutInvalidationTracking) {
            this.cause.reason = "Layout forced";
        }
    }
}
exports.InvalidationTrackingEvent = InvalidationTrackingEvent;
class InvalidationTracker {
    lastRecalcStyle;
    lastPaintWithLayer;
    didPaint;
    invalidations;
    invalidationsByNodeId;
    constructor() {
        this.lastRecalcStyle = null;
        this.lastPaintWithLayer = null;
        this.didPaint = false;
        this.initializePerFrameState();
        this.invalidations = {};
        this.invalidationsByNodeId = {};
    }
    static invalidationEventsFor(event) {
        return eventToInvalidation.get(event) || null;
    }
    addInvalidation(invalidation) {
        this.startNewFrameIfNeeded();
        if (!invalidation.nodeId) {
            console.error("Invalidation lacks node information.");
            console.error(invalidation);
            return;
        }
        // Suppress StyleInvalidator StyleRecalcInvalidationTracking invalidations because they
        // will be handled by StyleInvalidatorInvalidationTracking.
        // FIXME: Investigate if we can remove StyleInvalidator invalidations entirely.
        if (invalidation.type === RecordType.StyleRecalcInvalidationTracking &&
            invalidation.cause.reason === "StyleInvalidator") {
            return;
        }
        // Style invalidation events can occur before and during recalc style. didRecalcStyle
        // handles style invalidations that occur before the recalc style event but we need to
        // handle style recalc invalidations during recalc style here.
        const styleRecalcInvalidation = invalidation.type === RecordType.ScheduleStyleInvalidationTracking ||
            invalidation.type === RecordType.StyleInvalidatorInvalidationTracking ||
            invalidation.type === RecordType.StyleRecalcInvalidationTracking;
        if (styleRecalcInvalidation) {
            const duringRecalcStyle = invalidation.startTime &&
                this.lastRecalcStyle &&
                this.lastRecalcStyle.endTime !== undefined &&
                invalidation.startTime >= this.lastRecalcStyle.startTime &&
                invalidation.startTime <= this.lastRecalcStyle.endTime;
            if (duringRecalcStyle) {
                this.associateWithLastRecalcStyleEvent(invalidation);
            }
        }
        // Record the invalidation so later events can look it up.
        if (this.invalidations[invalidation.type]) {
            this.invalidations[invalidation.type].push(invalidation);
        }
        else {
            this.invalidations[invalidation.type] = [invalidation];
        }
        if (invalidation.nodeId) {
            if (this.invalidationsByNodeId[invalidation.nodeId]) {
                this.invalidationsByNodeId[invalidation.nodeId].push(invalidation);
            }
            else {
                this.invalidationsByNodeId[invalidation.nodeId] = [invalidation];
            }
        }
    }
    didRecalcStyle(recalcStyleEvent) {
        this.lastRecalcStyle = recalcStyleEvent;
        const types = [
            RecordType.ScheduleStyleInvalidationTracking,
            RecordType.StyleInvalidatorInvalidationTracking,
            RecordType.StyleRecalcInvalidationTracking,
        ];
        for (const invalidation of this.invalidationsOfTypes(types)) {
            this.associateWithLastRecalcStyleEvent(invalidation);
        }
    }
    associateWithLastRecalcStyleEvent(invalidation) {
        if (invalidation.linkedRecalcStyleEvent) {
            return;
        }
        if (!this.lastRecalcStyle) {
            throw new Error("Last recalculate style event not set.");
        }
        const recalcStyleFrameId = this.lastRecalcStyle.args["beginData"]["frame"];
        if (invalidation.type === RecordType.StyleInvalidatorInvalidationTracking) {
            // Instead of calling addInvalidationToEvent directly, we create synthetic
            // StyleRecalcInvalidationTracking events which will be added in addInvalidationToEvent.
            this.addSyntheticStyleRecalcInvalidations(this.lastRecalcStyle, recalcStyleFrameId, invalidation);
        }
        else if (invalidation.type === RecordType.ScheduleStyleInvalidationTracking) {
            // ScheduleStyleInvalidationTracking events are only used for adding information to
            // StyleInvalidatorInvalidationTracking events. See: addSyntheticStyleRecalcInvalidations.
        }
        else {
            this.addInvalidationToEvent(this.lastRecalcStyle, recalcStyleFrameId, invalidation);
        }
        invalidation.linkedRecalcStyleEvent = true;
    }
    addSyntheticStyleRecalcInvalidations(event, frameId, styleInvalidatorInvalidation) {
        if (!styleInvalidatorInvalidation.invalidationList) {
            this.addSyntheticStyleRecalcInvalidation(styleInvalidatorInvalidation.tracingEvent, styleInvalidatorInvalidation);
            return;
        }
        if (!styleInvalidatorInvalidation.nodeId) {
            console.error("Invalidation lacks node information.");
            console.error(styleInvalidatorInvalidation);
            return;
        }
        for (let i = 0; i < styleInvalidatorInvalidation.invalidationList.length; i++) {
            const setId = styleInvalidatorInvalidation.invalidationList[i]["id"];
            let lastScheduleStyleRecalculation;
            const nodeInvalidations = this.invalidationsByNodeId[styleInvalidatorInvalidation.nodeId] || [];
            for (let j = 0; j < nodeInvalidations.length; j++) {
                const invalidation = nodeInvalidations[j];
                if (invalidation.frame !== frameId ||
                    invalidation.invalidationSet !== setId ||
                    invalidation.type !== RecordType.ScheduleStyleInvalidationTracking) {
                    continue;
                }
                lastScheduleStyleRecalculation = invalidation;
            }
            if (!lastScheduleStyleRecalculation) {
                continue;
            }
            this.addSyntheticStyleRecalcInvalidation(lastScheduleStyleRecalculation.tracingEvent, styleInvalidatorInvalidation);
        }
    }
    addSyntheticStyleRecalcInvalidation(baseEvent, styleInvalidatorInvalidation) {
        const timelineData = TimelineData.forEvent(baseEvent);
        const invalidation = new InvalidationTrackingEvent(baseEvent, timelineData);
        invalidation.type = RecordType.StyleRecalcInvalidationTracking;
        if (styleInvalidatorInvalidation.cause.reason) {
            invalidation.cause.reason = styleInvalidatorInvalidation.cause.reason;
        }
        if (styleInvalidatorInvalidation.selectorPart) {
            invalidation.selectorPart = styleInvalidatorInvalidation.selectorPart;
        }
        if (!invalidation.linkedRecalcStyleEvent) {
            this.associateWithLastRecalcStyleEvent(invalidation);
        }
    }
    didLayout(layoutEvent) {
        const layoutFrameId = layoutEvent.args["beginData"]["frame"];
        for (const invalidation of this.invalidationsOfTypes([
            RecordType.LayoutInvalidationTracking,
        ])) {
            if (invalidation.linkedLayoutEvent) {
                continue;
            }
            this.addInvalidationToEvent(layoutEvent, layoutFrameId, invalidation);
            invalidation.linkedLayoutEvent = true;
        }
    }
    addInvalidationToEvent(event, eventFrameId, invalidation) {
        if (eventFrameId !== invalidation.frame) {
            return;
        }
        const invalidations = eventToInvalidation.get(event);
        if (!invalidations) {
            eventToInvalidation.set(event, [invalidation]);
        }
        else {
            invalidations.push(invalidation);
        }
    }
    invalidationsOfTypes(types) {
        const invalidations = this.invalidations;
        if (!types) {
            types = Object.keys(invalidations);
        }
        function* generator() {
            if (!types) {
                return;
            }
            for (let i = 0; i < types.length; ++i) {
                const invalidationList = invalidations[types[i]] || [];
                for (let j = 0; j < invalidationList.length; ++j) {
                    yield invalidationList[j];
                }
            }
        }
        return generator();
    }
    startNewFrameIfNeeded() {
        if (!this.didPaint) {
            return;
        }
        this.initializePerFrameState();
    }
    initializePerFrameState() {
        this.invalidations = {};
        this.invalidationsByNodeId = {};
        this.lastRecalcStyle = null;
        this.lastPaintWithLayer = null;
        this.didPaint = false;
    }
}
exports.InvalidationTracker = InvalidationTracker;
class TimelineAsyncEventTracker {
    initiatorByType;
    constructor() {
        TimelineAsyncEventTracker.initialize();
        this.initiatorByType = new Map();
        if (TimelineAsyncEventTracker.asyncEvents) {
            for (const initiator of TimelineAsyncEventTracker.asyncEvents.keys()) {
                this.initiatorByType.set(initiator, new Map());
            }
        }
    }
    static initialize() {
        if (TimelineAsyncEventTracker.asyncEvents) {
            return;
        }
        const events = new Map();
        events.set(RecordType.TimerInstall, {
            causes: [RecordType.TimerFire],
            joinBy: "timerId",
        });
        events.set(RecordType.ResourceSendRequest, {
            causes: [
                RecordType.ResourceMarkAsCached,
                RecordType.ResourceReceiveResponse,
                RecordType.ResourceReceivedData,
                RecordType.ResourceFinish,
            ],
            joinBy: "requestId",
        });
        events.set(RecordType.RequestAnimationFrame, {
            causes: [RecordType.FireAnimationFrame],
            joinBy: "id",
        });
        events.set(RecordType.RequestIdleCallback, {
            causes: [RecordType.FireIdleCallback],
            joinBy: "id",
        });
        events.set(RecordType.WebSocketCreate, {
            causes: [
                RecordType.WebSocketSendHandshakeRequest,
                RecordType.WebSocketReceiveHandshakeResponse,
                RecordType.WebSocketDestroy,
            ],
            joinBy: "identifier",
        });
        TimelineAsyncEventTracker.asyncEvents = events;
        TimelineAsyncEventTracker.typeToInitiator = new Map();
        for (const entry of events) {
            const types = entry[1].causes;
            for (const currentType of types) {
                TimelineAsyncEventTracker.typeToInitiator.set(currentType, entry[0]);
            }
        }
    }
    processEvent(event) {
        if (!TimelineAsyncEventTracker.typeToInitiator ||
            !TimelineAsyncEventTracker.asyncEvents) {
            return;
        }
        let initiatorType = TimelineAsyncEventTracker.typeToInitiator.get(event.name);
        const isInitiator = !initiatorType;
        if (!initiatorType) {
            initiatorType = event.name;
        }
        const initiatorInfo = TimelineAsyncEventTracker.asyncEvents.get(initiatorType);
        if (!initiatorInfo) {
            return;
        }
        const id = TimelineModelImpl.globalEventId(event, initiatorInfo.joinBy);
        if (!id) {
            return;
        }
        const initiatorMap = this.initiatorByType.get(initiatorType);
        if (initiatorMap) {
            if (isInitiator) {
                initiatorMap.set(id, event);
                return;
            }
            const initiator = initiatorMap.get(id);
            const timelineData = TimelineData.forEvent(event);
            timelineData.setInitiator(initiator ? initiator : null);
            if (!timelineData.frameId && initiator) {
                timelineData.frameId = TimelineModelImpl.eventFrameId(initiator);
            }
        }
    }
    static asyncEvents = null;
    static typeToInitiator = null;
}
exports.TimelineAsyncEventTracker = TimelineAsyncEventTracker;
class TimelineData {
    warning;
    previewElement;
    url;
    backendNodeIds;
    stackTrace;
    picture;
    initiatorInternal;
    frameId;
    timeWaitingForMainThread;
    constructor() {
        this.warning = null;
        this.previewElement = null;
        this.url = null;
        this.backendNodeIds = [];
        this.stackTrace = null;
        this.picture = null;
        this.initiatorInternal = null;
        this.frameId = null;
    }
    setInitiator(initiator) {
        this.initiatorInternal = initiator;
        if (!initiator || this.url) {
            return;
        }
        const initiatorURL = TimelineData.forEvent(initiator).url;
        if (initiatorURL) {
            this.url = initiatorURL;
        }
    }
    initiator() {
        return this.initiatorInternal;
    }
    topFrame() {
        const stackTrace = this.stackTraceForSelfOrInitiator();
        return (stackTrace && stackTrace[0]) || null;
    }
    stackTraceForSelfOrInitiator() {
        return (this.stackTrace ||
            (this.initiatorInternal &&
                TimelineData.forEvent(this.initiatorInternal).stackTrace));
    }
    static forEvent(event) {
        let data = eventToData.get(event);
        if (!data) {
            data = new TimelineData();
            eventToData.set(event, data);
        }
        return data;
    }
}
exports.TimelineData = TimelineData;
const eventToData = new WeakMap();
const eventToInvalidation = new WeakMap();
//# sourceMappingURL=TimelineModel.js.map