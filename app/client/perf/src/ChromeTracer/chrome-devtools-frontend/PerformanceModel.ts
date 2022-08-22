// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// import * as SDK from "../../core/sdk/sdk.js";
// import type * as Bindings from '../../models/bindings/bindings.js';
import { DOMError, OutputStream } from "./chrome-devtools-types";
import { ObjectWrapper } from "./Object";
// import * as ObjectWrapper from "./Object";
import { TimelineModelImpl } from "./TimelineModel";
import { AsyncEvent, Event, TracingModel } from "./TracingModel";
export class PerformanceModel extends ObjectWrapper<EventTypes> {
  private mainTargetInternal: any | null;
  private tracingModelInternal: TracingModel | null;
  private filtersInternal: any[];
  private readonly timelineModelInternal: any;
  private readonly frameModelInternal: any;
  private filmStripModelInternal: any | null;
  private readonly irModel: any;
  private windowInternal: Window;
  private readonly extensionTracingModels: {
    title: string;
    model: TracingModel;
    timeOffset: number;
  }[];
  private recordStartTimeInternal?: number;

  constructor() {
    super();
    this.mainTargetInternal = null;
    this.tracingModelInternal = null;
    this.filtersInternal = [];

    this.timelineModelInternal = new TimelineModelImpl();
    // this.frameModelInternal = new TimelineModel.TimelineFrameModel.TimelineFrameModel(
    //   (event) => TimelineUIUtils.eventStyle(event).category.name,
    // );
    this.filmStripModelInternal = null;
    // this.irModel = new TimelineModel.TimelineIRModel.TimelineIRModel();

    this.windowInternal = { left: 0, right: Infinity };

    this.extensionTracingModels = [];
    this.recordStartTimeInternal = undefined;
  }

  setMainTarget(target: any): void {
    this.mainTargetInternal = target;
  }

  mainTarget(): any | null {
    return this.mainTargetInternal;
  }

  setRecordStartTime(time: number): void {
    this.recordStartTimeInternal = time;
  }

  recordStartTime(): number | undefined {
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

  isVisible(event: Event): boolean {
    return this.filtersInternal.every((f) => f.accept(event));
  }

  setTracingModel(model: TracingModel): void {
    this.tracingModelInternal = model;
    this.timelineModelInternal.setEvents(model);

    const animationEvents: AsyncEvent[] | null = null;
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
      .filter(
        (track: any) =>
          track.type === "MainThread" &&
          track.forMainFrame &&
          track.events.length,
      );
    const threadData = mainTracks.map((track: any) => {
      const event = track.events[0];
      return { thread: event.thread, time: event.startTime };
    });
    // this.frameModelInternal.addTraceEvents(
    //   this.mainTargetInternal,
    //   this.timelineModelInternal.inspectedTargetEvents(),
    //   threadData,
    // );

    for (const entry of this.extensionTracingModels) {
      entry.model.adjustTime(
        this.tracingModelInternal.minimumRecordTime() +
          entry.timeOffset / 1000 -
          (this.recordStartTimeInternal as number),
      );
    }
    this.autoWindowTimes();
  }

  addExtensionEvents(
    title: string,
    model: TracingModel,
    timeOffset: number,
  ): void {
    this.extensionTracingModels.push({
      model: model,
      title: title,
      timeOffset: timeOffset,
    });
    if (!this.tracingModelInternal) {
      return;
    }
    model.adjustTime(
      this.tracingModelInternal.minimumRecordTime() +
        timeOffset / 1000 -
        (this.recordStartTimeInternal as number),
    );
    this.dispatchEventToListeners(Events.ExtensionDataAdded);
  }

  tracingModel(): TracingModel {
    if (!this.tracingModelInternal) {
      throw "call setTracingModel before accessing PerformanceModel";
    }
    return this.tracingModelInternal;
  }

  timelineModel(): any {
    return this.timelineModelInternal;
  }

  filmStripModel(): any {
    if (this.filmStripModelInternal) {
      return this.filmStripModelInternal;
    }
    if (!this.tracingModelInternal) {
      throw "call setTracingModel before accessing PerformanceModel";
    }
    this.filmStripModelInternal = null;
    return this.filmStripModelInternal;
  }

  frames(): any {
    return this.frameModelInternal.getFrames();
  }

  frameModel(): any {
    return this.frameModelInternal;
  }

  interactionRecords(): any {
    return this.irModel.interactionRecords();
  }

  extensionInfo(): {
    title: string;
    model: TracingModel;
  }[] {
    return this.extensionTracingModels;
  }

  dispose(): void {
    if (this.tracingModelInternal) {
      this.tracingModelInternal.dispose();
    }
    for (const extensionEntry of this.extensionTracingModels) {
      extensionEntry.model.dispose();
    }
  }

  filmStripModelFrame(frame: any): any {
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

  save(stream: OutputStream): Promise<DOMError | null> {
    if (!this.tracingModelInternal) {
      throw "call setTracingModel before accessing PerformanceModel";
    }
    const backingStorage = this.tracingModelInternal.backingStorage() as any;
    return backingStorage.writeToStream(stream);
  }

  setWindow(window: Window, animate?: boolean): void {
    this.windowInternal = window;
    this.dispatchEventToListeners(Events.WindowChanged, { window, animate });
  }

  window(): Window {
    return this.windowInternal;
  }

  private autoWindowTimes(): void {
    const timelineModel = this.timelineModelInternal;
    let tasks: Event[] = [];
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

    function findLowUtilizationRegion(
      startIndex: number,
      stopIndex: number,
    ): number {
      const threshold = 0.1;
      let cutIndex = startIndex;
      let cutTime =
        (tasks[cutIndex].startTime + (tasks[cutIndex].endTime as number)) / 2;
      let usedTime = 0;
      const step = Math.sign(stopIndex - startIndex);
      for (let i = startIndex; i !== stopIndex; i += step) {
        const task = tasks[i];
        const taskTime = (task.startTime + (task.endTime as number)) / 2;
        const interval = Math.abs(cutTime - taskTime);
        if (usedTime < threshold * interval) {
          cutIndex = i;
          cutTime = taskTime;
          usedTime = 0;
        }
        usedTime += task.duration as number;
      }
      return cutIndex;
    }
    const rightIndex = findLowUtilizationRegion(tasks.length - 1, 0);
    const leftIndex = findLowUtilizationRegion(0, rightIndex);
    let leftTime: number = tasks[leftIndex].startTime;
    let rightTime: number = tasks[rightIndex].endTime as number;
    const span = rightTime - leftTime;
    const totalSpan =
      timelineModel.maximumRecordTime() - timelineModel.minimumRecordTime();
    if (span < totalSpan * 0.1) {
      leftTime = timelineModel.minimumRecordTime();
      rightTime = timelineModel.maximumRecordTime();
    } else {
      leftTime = Math.max(
        leftTime - 0.05 * span,
        timelineModel.minimumRecordTime(),
      );
      rightTime = Math.min(
        rightTime + 0.05 * span,
        timelineModel.maximumRecordTime(),
      );
    }
    this.setWindow({ left: leftTime, right: rightTime });
  }
}

// TODO(crbug.com/1167717): Make this a const enum again
export enum Events {
  ExtensionDataAdded = "ExtensionDataAdded",
  WindowChanged = "WindowChanged",
}

export interface WindowChangedEvent {
  window: Window;
  animate: boolean | undefined;
}

export type EventTypes = {
  [Events.ExtensionDataAdded]: void;
  [Events.WindowChanged]: WindowChangedEvent;
};

export interface Window {
  left: number;
  right: number;
}
