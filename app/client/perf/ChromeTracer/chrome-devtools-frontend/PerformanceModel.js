"use strict";
// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = exports.PerformanceModel = void 0;
const Object_1 = require("./Object");
// import * as ObjectWrapper from "./Object";
const TimelineModel_1 = require("./TimelineModel");
class PerformanceModel extends Object_1.ObjectWrapper {
    mainTargetInternal;
    tracingModelInternal;
    filtersInternal;
    timelineModelInternal;
    frameModelInternal;
    filmStripModelInternal;
    irModel;
    windowInternal;
    extensionTracingModels;
    recordStartTimeInternal;
    constructor() {
        super();
        this.mainTargetInternal = null;
        this.tracingModelInternal = null;
        this.filtersInternal = [];
        this.timelineModelInternal = new TimelineModel_1.TimelineModelImpl();
        // this.frameModelInternal = new TimelineModel.TimelineFrameModel.TimelineFrameModel(
        //   (event) => TimelineUIUtils.eventStyle(event).category.name,
        // );
        this.filmStripModelInternal = null;
        // this.irModel = new TimelineModel.TimelineIRModel.TimelineIRModel();
        this.windowInternal = { left: 0, right: Infinity };
        this.extensionTracingModels = [];
        this.recordStartTimeInternal = undefined;
    }
    setMainTarget(target) {
        this.mainTargetInternal = target;
    }
    mainTarget() {
        return this.mainTargetInternal;
    }
    setRecordStartTime(time) {
        this.recordStartTimeInternal = time;
    }
    recordStartTime() {
        return this.recordStartTimeInternal;
    }
    //   setFilters(
    //     filters: TimelineModel.TimelineModelFilter.TimelineModelFilter[],
    //   ): void {
    //     this.filtersInternal = filters;
    //   }
    //   filters(): TimelineModel.TimelineModelFilter.TimelineModelFilter[] {
    //     return this.filtersInternal;
    //   }
    isVisible(event) {
        return this.filtersInternal.every((f) => f.accept(event));
    }
    setTracingModel(model) {
        this.tracingModelInternal = model;
        this.timelineModelInternal.setEvents(model);
        const animationEvents = null;
        for (const track of this.timelineModelInternal.tracks()) {
            //   if (track.type === TimelineModel.TimelineModel.TrackType.Animation) {
            //     animationEvents = track.asyncEvents;
            //   }
        }
        if (animationEvents) {
            this.irModel.populate([], animationEvents || []);
        }
        const mainTracks = this.timelineModelInternal
            .tracks()
            .filter((track) => track.type === "MainThread" &&
            track.forMainFrame &&
            track.events.length);
        const threadData = mainTracks.map((track) => {
            const event = track.events[0];
            return { thread: event.thread, time: event.startTime };
        });
        // this.frameModelInternal.addTraceEvents(
        //   this.mainTargetInternal,
        //   this.timelineModelInternal.inspectedTargetEvents(),
        //   threadData,
        // );
        for (const entry of this.extensionTracingModels) {
            entry.model.adjustTime(this.tracingModelInternal.minimumRecordTime() +
                entry.timeOffset / 1000 -
                this.recordStartTimeInternal);
        }
        this.autoWindowTimes();
    }
    addExtensionEvents(title, model, timeOffset) {
        this.extensionTracingModels.push({
            model: model,
            title: title,
            timeOffset: timeOffset,
        });
        if (!this.tracingModelInternal) {
            return;
        }
        model.adjustTime(this.tracingModelInternal.minimumRecordTime() +
            timeOffset / 1000 -
            this.recordStartTimeInternal);
        this.dispatchEventToListeners(Events.ExtensionDataAdded);
    }
    tracingModel() {
        if (!this.tracingModelInternal) {
            throw "call setTracingModel before accessing PerformanceModel";
        }
        return this.tracingModelInternal;
    }
    timelineModel() {
        return this.timelineModelInternal;
    }
    filmStripModel() {
        if (this.filmStripModelInternal) {
            return this.filmStripModelInternal;
        }
        if (!this.tracingModelInternal) {
            throw "call setTracingModel before accessing PerformanceModel";
        }
        this.filmStripModelInternal = null;
        return this.filmStripModelInternal;
    }
    frames() {
        return this.frameModelInternal.getFrames();
    }
    frameModel() {
        return this.frameModelInternal;
    }
    interactionRecords() {
        return this.irModel.interactionRecords();
    }
    extensionInfo() {
        return this.extensionTracingModels;
    }
    dispose() {
        if (this.tracingModelInternal) {
            this.tracingModelInternal.dispose();
        }
        for (const extensionEntry of this.extensionTracingModels) {
            extensionEntry.model.dispose();
        }
    }
    filmStripModelFrame(frame) {
        return null;
        // For idle frames, look at the state at the beginning of the frame.
        // const screenshotTime = frame.idle ? frame.startTime : frame.endTime;
        // const filmStripModel = this
        //   .filmStripModelInternal as SDK.FilmStripModel.FilmStripModel;
        // const filmStripFrame = filmStripModel.frameByTimestamp(screenshotTime);
        // return filmStripFrame && filmStripFrame.timestamp - frame.endTime < 10
        //   ? filmStripFrame
        //   : null;
    }
    save(stream) {
        if (!this.tracingModelInternal) {
            throw "call setTracingModel before accessing PerformanceModel";
        }
        const backingStorage = this.tracingModelInternal.backingStorage();
        return backingStorage.writeToStream(stream);
    }
    setWindow(window, animate) {
        this.windowInternal = window;
        this.dispatchEventToListeners(Events.WindowChanged, { window, animate });
    }
    window() {
        return this.windowInternal;
    }
    autoWindowTimes() {
        const timelineModel = this.timelineModelInternal;
        let tasks = [];
        for (const track of timelineModel.tracks()) {
            // Deliberately pick up last main frame's track.
            if (track.type === "MainThread" && track.forMainFrame) {
                tasks = track.tasks;
            }
        }
        if (!tasks.length) {
            this.setWindow({
                left: timelineModel.minimumRecordTime(),
                right: timelineModel.maximumRecordTime(),
            });
            return;
        }
        function findLowUtilizationRegion(startIndex, stopIndex) {
            const threshold = 0.1;
            let cutIndex = startIndex;
            let cutTime = (tasks[cutIndex].startTime + tasks[cutIndex].endTime) / 2;
            let usedTime = 0;
            const step = Math.sign(stopIndex - startIndex);
            for (let i = startIndex; i !== stopIndex; i += step) {
                const task = tasks[i];
                const taskTime = (task.startTime + task.endTime) / 2;
                const interval = Math.abs(cutTime - taskTime);
                if (usedTime < threshold * interval) {
                    cutIndex = i;
                    cutTime = taskTime;
                    usedTime = 0;
                }
                usedTime += task.duration;
            }
            return cutIndex;
        }
        const rightIndex = findLowUtilizationRegion(tasks.length - 1, 0);
        const leftIndex = findLowUtilizationRegion(0, rightIndex);
        let leftTime = tasks[leftIndex].startTime;
        let rightTime = tasks[rightIndex].endTime;
        const span = rightTime - leftTime;
        const totalSpan = timelineModel.maximumRecordTime() - timelineModel.minimumRecordTime();
        if (span < totalSpan * 0.1) {
            leftTime = timelineModel.minimumRecordTime();
            rightTime = timelineModel.maximumRecordTime();
        }
        else {
            leftTime = Math.max(leftTime - 0.05 * span, timelineModel.minimumRecordTime());
            rightTime = Math.min(rightTime + 0.05 * span, timelineModel.maximumRecordTime());
        }
        this.setWindow({ left: leftTime, right: rightTime });
    }
}
exports.PerformanceModel = PerformanceModel;
// TODO(crbug.com/1167717): Make this a const enum again
var Events;
(function (Events) {
    Events["ExtensionDataAdded"] = "ExtensionDataAdded";
    Events["WindowChanged"] = "WindowChanged";
})(Events = exports.Events || (exports.Events = {}));
//# sourceMappingURL=PerformanceModel.js.map