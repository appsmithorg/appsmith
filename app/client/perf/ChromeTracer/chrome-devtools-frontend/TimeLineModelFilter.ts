// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { RecordType, TimelineModelImpl } from "./TimelineModel";
import { Event } from "./TracingModel";

// import {RecordType, TimelineModelImpl} from './TimelineModel.js';

export class TimelineModelFilter {
  accept(_event: Event): boolean {
    return true;
  }
}

export class TimelineVisibleEventsFilter extends TimelineModelFilter {
  private readonly visibleTypes: Set<string>;
  constructor(visibleTypes: string[]) {
    super();
    this.visibleTypes = new Set(visibleTypes);
  }

  accept(event: Event): boolean {
    return this.visibleTypes.has(TimelineVisibleEventsFilter.eventType(event));
  }

  static eventType(event: Event): RecordType {
    if (event.hasCategory(TimelineModelImpl.Category.Console)) {
      return RecordType.ConsoleTime;
    }
    if (event.hasCategory(TimelineModelImpl.Category.UserTiming)) {
      return RecordType.UserTiming;
    }
    if (event.hasCategory(TimelineModelImpl.Category.LatencyInfo)) {
      return RecordType.LatencyInfo;
    }
    return event.name as RecordType;
  }
}

export class TimelineInvisibleEventsFilter extends TimelineModelFilter {
  private invisibleTypes: Set<string>;
  constructor(invisibleTypes: string[]) {
    super();
    this.invisibleTypes = new Set(invisibleTypes);
  }

  accept(event: Event): boolean {
    return !this.invisibleTypes.has(
      TimelineVisibleEventsFilter.eventType(event),
    );
  }
}

export class ExclusiveNameFilter extends TimelineModelFilter {
  private excludeNames: Set<string>;
  constructor(excludeNames: string[]) {
    super();
    this.excludeNames = new Set(excludeNames);
  }

  accept(event: Event): boolean {
    return !this.excludeNames.has(event.name);
  }
}
