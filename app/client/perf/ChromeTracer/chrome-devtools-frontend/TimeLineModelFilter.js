"use strict";
// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExclusiveNameFilter = exports.TimelineInvisibleEventsFilter = exports.TimelineVisibleEventsFilter = exports.TimelineModelFilter = void 0;
const TimelineModel_1 = require("./TimelineModel");
// import {RecordType, TimelineModelImpl} from './TimelineModel.js';
class TimelineModelFilter {
    accept(_event) {
        return true;
    }
}
exports.TimelineModelFilter = TimelineModelFilter;
class TimelineVisibleEventsFilter extends TimelineModelFilter {
    visibleTypes;
    constructor(visibleTypes) {
        super();
        this.visibleTypes = new Set(visibleTypes);
    }
    accept(event) {
        return this.visibleTypes.has(TimelineVisibleEventsFilter.eventType(event));
    }
    static eventType(event) {
        if (event.hasCategory(TimelineModel_1.TimelineModelImpl.Category.Console)) {
            return TimelineModel_1.RecordType.ConsoleTime;
        }
        if (event.hasCategory(TimelineModel_1.TimelineModelImpl.Category.UserTiming)) {
            return TimelineModel_1.RecordType.UserTiming;
        }
        if (event.hasCategory(TimelineModel_1.TimelineModelImpl.Category.LatencyInfo)) {
            return TimelineModel_1.RecordType.LatencyInfo;
        }
        return event.name;
    }
}
exports.TimelineVisibleEventsFilter = TimelineVisibleEventsFilter;
class TimelineInvisibleEventsFilter extends TimelineModelFilter {
    invisibleTypes;
    constructor(invisibleTypes) {
        super();
        this.invisibleTypes = new Set(invisibleTypes);
    }
    accept(event) {
        return !this.invisibleTypes.has(TimelineVisibleEventsFilter.eventType(event));
    }
}
exports.TimelineInvisibleEventsFilter = TimelineInvisibleEventsFilter;
class ExclusiveNameFilter extends TimelineModelFilter {
    excludeNames;
    constructor(excludeNames) {
        super();
        this.excludeNames = new Set(excludeNames);
    }
    accept(event) {
        return !this.excludeNames.has(event.name);
    }
}
exports.ExclusiveNameFilter = ExclusiveNameFilter;
//# sourceMappingURL=TimeLineModelFilter.js.map