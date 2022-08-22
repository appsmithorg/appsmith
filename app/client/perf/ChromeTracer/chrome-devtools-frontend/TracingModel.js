"use strict";
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/ban-types */
// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Thread = exports.Process = exports.AsyncEvent = exports.ObjectSnapshot = exports.Event = exports.BackingStorage = exports.DevToolsTimelineEventCategory = exports.DevToolsMetadataEventCategory = exports.LegacyTopLevelEventCategory = exports.MetadataEvent = exports.Phase = exports.TracingModel = void 0;
class TracingModel {
    // eslint-disable-next-line prettier/prettier
    #backingStorageInternal;
    #firstWritePending;
    #processById;
    #processByName;
    #minimumRecordTimeInternal;
    #maximumRecordTimeInternal;
    #devToolsMetadataEventsInternal;
    #asyncEvents;
    #openAsyncEvents;
    #openNestableAsyncEvents;
    #profileGroups;
    #parsedCategories;
    #mainFrameNavStartTimes;
    constructor(backingStorage) {
        this.#backingStorageInternal = backingStorage;
        // Avoid extra reset of the storage as it's expensive.
        this.#firstWritePending = true;
        this.#processById = new Map();
        this.#processByName = new Map();
        this.#minimumRecordTimeInternal = Number(Infinity);
        this.#maximumRecordTimeInternal = Number(-Infinity);
        this.#devToolsMetadataEventsInternal = [];
        this.#asyncEvents = [];
        this.#openAsyncEvents = new Map();
        this.#openNestableAsyncEvents = new Map();
        this.#profileGroups = new Map();
        this.#parsedCategories = new Map();
        this.#mainFrameNavStartTimes = new Map();
    }
    static isNestableAsyncPhase(phase) {
        return phase === 'b' || phase === 'e' || phase === 'n';
    }
    static isAsyncBeginPhase(phase) {
        return phase === 'S' || phase === 'b';
    }
    static isAsyncPhase(phase) {
        return TracingModel.isNestableAsyncPhase(phase) || phase === 'S' || phase === 'T' || phase === 'F' || phase === 'p';
    }
    static isFlowPhase(phase) {
        return phase === 's' || phase === 't' || phase === 'f';
    }
    static isCompletePhase(phase) {
        return phase === 'X';
    }
    static isTopLevelEvent(event) {
        return event.hasCategory(exports.DevToolsTimelineEventCategory) && event.name === 'RunTask' ||
            event.hasCategory(exports.LegacyTopLevelEventCategory) ||
            event.hasCategory(exports.DevToolsMetadataEventCategory) &&
                event.name === 'Program'; // Older timelines may have this instead of toplevel.
    }
    static extractId(payload) {
        const scope = payload.scope || '';
        if (typeof payload.id2 === 'undefined') {
            return scope && payload.id ? `${scope}@${payload.id}` : payload.id;
        }
        const id2 = payload.id2;
        if (typeof id2 === 'object' && ('global' in id2) !== ('local' in id2)) {
            return typeof id2['global'] !== 'undefined' ? `:${scope}:${id2['global']}` :
                `:${scope}:${payload.pid}:${id2['local']}`;
        }
        console.error(`Unexpected id2 field at ${payload.ts / 1000}, one and only one of 'local' and 'global' should be present.`);
        return undefined;
    }
    static browserMainThread(tracingModel) {
        const processes = tracingModel.sortedProcesses();
        // Avoid warning for an empty #model.
        if (!processes.length) {
            return null;
        }
        const browserMainThreadName = 'CrBrowserMain';
        const browserProcesses = [];
        const browserMainThreads = [];
        for (const process of processes) {
            if (process.name().toLowerCase().endsWith('browser')) {
                browserProcesses.push(process);
            }
            browserMainThreads.push(...process.sortedThreads().filter(t => t.name() === browserMainThreadName));
        }
        if (browserMainThreads.length === 1) {
            return browserMainThreads[0];
        }
        if (browserProcesses.length === 1) {
            return browserProcesses[0].threadByName(browserMainThreadName);
        }
        const tracingStartedInBrowser = tracingModel.devToolsMetadataEvents().filter(e => e.name === 'TracingStartedInBrowser');
        if (tracingStartedInBrowser.length === 1) {
            return tracingStartedInBrowser[0].thread;
        }
        return null;
    }
    devToolsMetadataEvents() {
        return this.#devToolsMetadataEventsInternal;
    }
    addEvents(events) {
        for (let i = 0; i < events.length; ++i) {
            this.addEvent(events[i]);
        }
    }
    tracingComplete() {
        this.processPendingAsyncEvents();
        this.#backingStorageInternal.appendString(this.#firstWritePending ? '[]' : ']');
        this.#backingStorageInternal.finishWriting();
        this.#firstWritePending = false;
        for (const process of this.#processById.values()) {
            for (const thread of process.threads.values()) {
                thread.tracingComplete();
            }
        }
    }
    dispose() {
        if (!this.#firstWritePending) {
            this.#backingStorageInternal.reset();
        }
    }
    adjustTime(offset) {
        this.#minimumRecordTimeInternal += offset;
        this.#maximumRecordTimeInternal += offset;
        for (const process of this.#processById.values()) {
            for (const thread of process.threads.values()) {
                for (const event of thread.events()) {
                    event.startTime += offset;
                    if (typeof event.endTime === 'number') {
                        event.endTime += offset;
                    }
                }
                for (const event of thread.asyncEvents()) {
                    event.startTime += offset;
                    if (typeof event.endTime === 'number') {
                        event.endTime += offset;
                    }
                }
            }
        }
    }
    addEvent(payload) {
        let process = this.#processById.get(payload.pid);
        if (!process) {
            process = new Process(this, payload.pid);
            this.#processById.set(payload.pid, process);
        }
        const phase = Phase;
        const eventsDelimiter = ',\n';
        this.#backingStorageInternal.appendString(this.#firstWritePending ? '[' : eventsDelimiter);
        this.#firstWritePending = false;
        const stringPayload = JSON.stringify(payload);
        const isAccessible = payload.ph === phase.SnapshotObject;
        let backingStorage = null;
        const keepStringsLessThan = 10000;
        if (false && stringPayload.length > keepStringsLessThan) {
            backingStorage = this.#backingStorageInternal.appendAccessibleString(stringPayload);
        }
        else {
            this.#backingStorageInternal.appendString(stringPayload);
        }
        const timestamp = payload.ts / 1000;
        // We do allow records for unrelated threads to arrive out-of-order,
        // so there's a chance we're getting records from the past.
        if (timestamp && timestamp < this.#minimumRecordTimeInternal &&
            (payload.ph === phase.Begin || payload.ph === phase.Complete || payload.ph === phase.Instant) &&
            // UMA related events are ignored when calculating the minimumRecordTime because they might
            // be related to previous navigations that happened before the current trace started and
            // will currently not be displayed anyways.
            // See crbug.com/1201198
            (!payload.name.endsWith('::UMA'))) {
            this.#minimumRecordTimeInternal = timestamp;
        }
        if (payload.name === 'TracingStartedInBrowser') {
            // If we received a timestamp for tracing start, use that for minimumRecordTime.
            this.#minimumRecordTimeInternal = timestamp;
        }
        // Track only main thread navigation start items. This is done by tracking
        // isOutermostMainFrame, and whether documentLoaderURL is set.
        if (payload.name === 'navigationStart') {
            const data = payload.args.data;
            if (data) {
                const { documentLoaderURL, isLoadingMainFrame, isOutermostMainFrame, navigationId } = data;
                if ((isOutermostMainFrame ?? isLoadingMainFrame) && documentLoaderURL !== '') {
                    const thread = process.threadById(payload.tid);
                    const navStartEvent = Event.fromPayload(payload, thread);
                    this.#mainFrameNavStartTimes.set(navigationId, navStartEvent);
                }
            }
        }
        const endTimeStamp = (payload.ts + (payload.dur || 0)) / 1000;
        this.#maximumRecordTimeInternal = Math.max(this.#maximumRecordTimeInternal, endTimeStamp);
        const event = process.addEvent(payload);
        if (!event) {
            return;
        }
        if (payload.ph === phase.Sample) {
            this.addSampleEvent(event);
            return;
        }
        // Build async event when we've got events from all threads & processes, so we can sort them and process in the
        // chronological order. However, also add individual async events to the thread flow (above), so we can easily
        // display them on the same chart as other events, should we choose so.
        if (TracingModel.isAsyncPhase(payload.ph)) {
            this.#asyncEvents.push(event);
        }
        event.setBackingStorage(backingStorage);
        if (event.hasCategory(exports.DevToolsMetadataEventCategory)) {
            this.#devToolsMetadataEventsInternal.push(event);
        }
        if (payload.ph !== phase.Metadata) {
            return;
        }
        switch (payload.name) {
            case exports.MetadataEvent.ProcessSortIndex: {
                process.setSortIndex(payload.args['sort_index']);
                break;
            }
            case exports.MetadataEvent.ProcessName: {
                const processName = payload.args['name'];
                process.setName(processName);
                this.#processByName.set(processName, process);
                break;
            }
            case exports.MetadataEvent.ThreadSortIndex: {
                process.threadById(payload.tid).setSortIndex(payload.args['sort_index']);
                break;
            }
            case exports.MetadataEvent.ThreadName: {
                process.threadById(payload.tid).setName(payload.args['name']);
                break;
            }
        }
    }
    addSampleEvent(event) {
        const id = `${event.thread.process().id()}:${event.id}`;
        const group = this.#profileGroups.get(id);
        if (group) {
            group.addChild(event);
        }
        else {
            this.#profileGroups.set(id, new ProfileEventsGroup(event));
        }
    }
    profileGroup(event) {
        return this.#profileGroups.get(`${event.thread.process().id()}:${event.id}`) || null;
    }
    minimumRecordTime() {
        return this.#minimumRecordTimeInternal;
    }
    maximumRecordTime() {
        return this.#maximumRecordTimeInternal;
    }
    navStartTimes() {
        return this.#mainFrameNavStartTimes;
    }
    sortedProcesses() {
        return NamedObject.sort([...this.#processById.values()]);
    }
    getProcessByName(name) {
        return this.#processByName.get(name) ?? null;
    }
    getProcessById(pid) {
        return this.#processById.get(pid) || null;
    }
    getThreadByName(processName, threadName) {
        const process = this.getProcessByName(processName);
        return process && process.threadByName(threadName);
    }
    processPendingAsyncEvents() {
        this.#asyncEvents.sort(Event.compareStartTime);
        for (let i = 0; i < this.#asyncEvents.length; ++i) {
            const event = this.#asyncEvents[i];
            if (TracingModel.isNestableAsyncPhase(event.phase)) {
                this.addNestableAsyncEvent(event);
            }
            else {
                this.addAsyncEvent(event);
            }
        }
        this.#asyncEvents = [];
        this.closeOpenAsyncEvents();
    }
    closeOpenAsyncEvents() {
        for (const event of this.#openAsyncEvents.values()) {
            event.setEndTime(this.#maximumRecordTimeInternal);
            // FIXME: remove this once we figure a better way to convert async console
            // events to sync [waterfall] timeline records.
            event.steps[0].setEndTime(this.#maximumRecordTimeInternal);
        }
        this.#openAsyncEvents.clear();
        for (const eventStack of this.#openNestableAsyncEvents.values()) {
            while (eventStack.length) {
                const event = eventStack.pop();
                if (!event) {
                    continue;
                }
                event.setEndTime(this.#maximumRecordTimeInternal);
            }
        }
        this.#openNestableAsyncEvents.clear();
    }
    addNestableAsyncEvent(event) {
        const phase = Phase;
        const key = event.categoriesString + '.' + event.id;
        let openEventsStack = this.#openNestableAsyncEvents.get(key);
        switch (event.phase) {
            case phase.NestableAsyncBegin: {
                if (!openEventsStack) {
                    openEventsStack = [];
                    this.#openNestableAsyncEvents.set(key, openEventsStack);
                }
                const asyncEvent = new AsyncEvent(event);
                openEventsStack.push(asyncEvent);
                event.thread.addAsyncEvent(asyncEvent);
                break;
            }
            case phase.NestableAsyncInstant: {
                if (openEventsStack && openEventsStack.length) {
                    const event = openEventsStack[openEventsStack.length - 1];
                    if (event) {
                        event.addStep(event);
                    }
                }
                break;
            }
            case phase.NestableAsyncEnd: {
                if (!openEventsStack || !openEventsStack.length) {
                    break;
                }
                const top = openEventsStack.pop();
                if (!top) {
                    break;
                }
                if (top.name !== event.name) {
                    console.error(`Begin/end event mismatch for nestable async event, ${top.name} vs. ${event.name}, key: ${key}`);
                    break;
                }
                top.addStep(event);
            }
        }
    }
    addAsyncEvent(event) {
        const phase = Phase;
        const key = event.categoriesString + '.' + event.name + '.' + event.id;
        let asyncEvent = this.#openAsyncEvents.get(key);
        if (event.phase === phase.AsyncBegin) {
            if (asyncEvent) {
                console.error(`Event ${event.name} has already been started`);
                return;
            }
            asyncEvent = new AsyncEvent(event);
            this.#openAsyncEvents.set(key, asyncEvent);
            event.thread.addAsyncEvent(asyncEvent);
            return;
        }
        if (!asyncEvent) {
            // Quietly ignore stray async events, we're probably too late for the start.
            return;
        }
        if (event.phase === phase.AsyncEnd) {
            asyncEvent.addStep(event);
            this.#openAsyncEvents.delete(key);
            return;
        }
        if (event.phase === phase.AsyncStepInto || event.phase === phase.AsyncStepPast) {
            const lastStep = asyncEvent.steps[asyncEvent.steps.length - 1];
            if (lastStep && lastStep.phase !== phase.AsyncBegin && lastStep.phase !== event.phase) {
                console.assert(false, 'Async event step phase mismatch: ' + lastStep.phase + ' at ' + lastStep.startTime + ' vs. ' + event.phase +
                    ' at ' + event.startTime);
                return;
            }
            asyncEvent.addStep(event);
            return;
        }
        console.assert(false, 'Invalid async event phase');
    }
    backingStorage() {
        return this.#backingStorageInternal;
    }
    parsedCategoriesForString(str) {
        let parsedCategories = this.#parsedCategories.get(str);
        if (!parsedCategories) {
            parsedCategories = new Set(str ? str.split(',') : []);
            this.#parsedCategories.set(str, parsedCategories);
        }
        return parsedCategories;
    }
}
exports.TracingModel = TracingModel;
// TODO(crbug.com/1167717): Make this a const enum again
var Phase;
(function (Phase) {
    Phase["Begin"] = "B";
    Phase["End"] = "E";
    Phase["Complete"] = "X";
    Phase["Instant"] = "I";
    Phase["AsyncBegin"] = "S";
    Phase["AsyncStepInto"] = "T";
    Phase["AsyncStepPast"] = "p";
    Phase["AsyncEnd"] = "F";
    Phase["NestableAsyncBegin"] = "b";
    Phase["NestableAsyncEnd"] = "e";
    Phase["NestableAsyncInstant"] = "n";
    Phase["FlowBegin"] = "s";
    Phase["FlowStep"] = "t";
    Phase["FlowEnd"] = "f";
    Phase["Metadata"] = "M";
    Phase["Counter"] = "C";
    Phase["Sample"] = "P";
    Phase["CreateObject"] = "N";
    Phase["SnapshotObject"] = "O";
    Phase["DeleteObject"] = "D";
})(Phase = exports.Phase || (exports.Phase = {}));
exports.MetadataEvent = {
    ProcessSortIndex: 'process_sort_index',
    ProcessName: 'process_name',
    ThreadSortIndex: 'thread_sort_index',
    ThreadName: 'thread_name',
};
// TODO(alph): LegacyTopLevelEventCategory is not recorded since M74 and used for loading
// legacy profiles. Drop at some point.
exports.LegacyTopLevelEventCategory = 'toplevel';
exports.DevToolsMetadataEventCategory = 'disabled-by-default-devtools.timeline';
exports.DevToolsTimelineEventCategory = 'disabled-by-default-devtools.timeline';
class BackingStorage {
    appendString(_string) {
    }
    finishWriting() {
    }
    reset() {
    }
}
exports.BackingStorage = BackingStorage;
class Event {
    categoriesString;
    #parsedCategories;
    name;
    phase;
    startTime;
    thread;
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args;
    id;
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
    // eslint-disable-next-line @typescript-eslint/naming-convention
    bind_id;
    ordinal;
    selfTime;
    endTime;
    duration;
    constructor(categories, name, phase, startTime, thread) {
        this.categoriesString = categories || '';
        this.#parsedCategories = thread.getModel().parsedCategoriesForString(this.categoriesString);
        this.name = name;
        this.phase = phase;
        this.startTime = startTime;
        this.thread = thread;
        this.args = {};
        this.ordinal = 0;
        this.selfTime = 0;
    }
    static fromPayload(payload, thread) {
        const event = new Event(payload.cat, payload.name, payload.ph, payload.ts / 1000, thread);
        if (payload.args) {
            event.addArgs(payload.args);
        }
        if (typeof payload.dur === 'number') {
            event.setEndTime((payload.ts + payload.dur) / 1000);
        }
        const id = TracingModel.extractId(payload);
        if (typeof id !== 'undefined') {
            event.id = id;
        }
        if (payload.bind_id) {
            event.bind_id = payload.bind_id;
        }
        return event;
    }
    static compareStartTime(a, b) {
        if (!a || !b) {
            return 0;
        }
        return a.startTime - b.startTime;
    }
    static orderedCompareStartTime(a, b) {
        // Array.mergeOrdered coalesces objects if comparator returns 0.
        // To change this behavior this comparator return -1 in the case events
        // startTime's are equal, so both events got placed into the result array.
        return a.startTime - b.startTime || a.ordinal - b.ordinal || -1;
    }
    hasCategory(categoryName) {
        return this.#parsedCategories.has(categoryName);
    }
    setEndTime(endTime) {
        if (endTime < this.startTime) {
            console.assert(false, 'Event out of order: ' + this.name);
            return;
        }
        this.endTime = endTime;
        this.duration = endTime - this.startTime;
    }
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addArgs(args) {
        // Shallow copy args to avoid modifying original #payload which may be saved to file.
        for (const name in args) {
            if (name in this.args) {
                console.error('Same argument name (' + name + ') is used for begin and end phases of ' + this.name);
            }
            this.args[name] = args[name];
        }
    }
    complete(endEvent) {
        if (endEvent.args) {
            this.addArgs(endEvent.args);
        }
        else {
            console.error('Missing mandatory event argument \'args\' at ' + endEvent.startTime);
        }
        this.setEndTime(endEvent.startTime);
    }
    setBackingStorage(_backingStorage) {
    }
}
exports.Event = Event;
class ObjectSnapshot extends Event {
    #backingStorage;
    #objectPromiseInternal;
    constructor(category, name, startTime, thread) {
        super(category, name, Phase.SnapshotObject, startTime, thread);
        this.#backingStorage = null;
        this.#objectPromiseInternal = null;
    }
    static fromPayload(payload, thread) {
        const snapshot = new ObjectSnapshot(payload.cat, payload.name, payload.ts / 1000, thread);
        const id = TracingModel.extractId(payload);
        if (typeof id !== 'undefined') {
            snapshot.id = id;
        }
        if (!payload.args || !payload.args['snapshot']) {
            console.error('Missing mandatory \'snapshot\' argument at ' + payload.ts / 1000);
            return snapshot;
        }
        if (payload.args) {
            snapshot.addArgs(payload.args);
        }
        return snapshot;
    }
    requestObject(callback) {
        const snapshot = this.args['snapshot'];
        if (snapshot) {
            callback(snapshot);
            return;
        }
        const storage = this.#backingStorage;
        if (storage) {
            storage().then(onRead, callback.bind(null, null));
        }
        function onRead(result) {
            if (!result) {
                callback(null);
                return;
            }
            try {
                const payload = JSON.parse(result);
                callback(payload['args']['snapshot']);
            }
            catch (e) {
                callback(null);
            }
        }
    }
    objectPromise() {
        if (!this.#objectPromiseInternal) {
            this.#objectPromiseInternal = new Promise(this.requestObject.bind(this));
        }
        return this.#objectPromiseInternal;
    }
    setBackingStorage(backingStorage) {
        if (!backingStorage) {
            return;
        }
        this.#backingStorage = backingStorage;
        this.args = {};
    }
}
exports.ObjectSnapshot = ObjectSnapshot;
class AsyncEvent extends Event {
    steps;
    causedFrame;
    constructor(startEvent) {
        super(startEvent.categoriesString, startEvent.name, startEvent.phase, startEvent.startTime, startEvent.thread);
        this.addArgs(startEvent.args);
        this.steps = [startEvent];
        this.causedFrame = false;
    }
    addStep(event) {
        this.steps.push(event);
        if (event.phase === Phase.AsyncEnd || event.phase === Phase.NestableAsyncEnd) {
            this.setEndTime(event.startTime);
            // FIXME: ideally, we shouldn't do this, but this makes the logic of converting
            // async console events to sync ones much simpler.
            this.steps[0].setEndTime(event.startTime);
        }
    }
}
exports.AsyncEvent = AsyncEvent;
class ProfileEventsGroup {
    children;
    constructor(event) {
        this.children = [event];
    }
    addChild(event) {
        this.children.push(event);
    }
}
class NamedObject {
    model;
    idInternal;
    #nameInternal;
    #sortIndex;
    constructor(model, id) {
        this.model = model;
        this.idInternal = id;
        this.#nameInternal = '';
        this.#sortIndex = 0;
    }
    static sort(array) {
        return array.sort((a, b) => {
            return a.#sortIndex !== b.#sortIndex ? a.#sortIndex - b.#sortIndex : a.name().localeCompare(b.name());
        });
    }
    setName(name) {
        this.#nameInternal = name;
    }
    name() {
        return this.#nameInternal;
    }
    id() {
        return this.idInternal;
    }
    setSortIndex(sortIndex) {
        this.#sortIndex = sortIndex;
    }
    getModel() {
        return this.model;
    }
}
class Process extends NamedObject {
    threads;
    #threadByNameInternal;
    constructor(model, id) {
        super(model, id);
        this.threads = new Map();
        this.#threadByNameInternal = new Map();
    }
    threadById(id) {
        let thread = this.threads.get(id);
        if (!thread) {
            thread = new Thread(this, id);
            this.threads.set(id, thread);
        }
        return thread;
    }
    threadByName(name) {
        return this.#threadByNameInternal.get(name) || null;
    }
    setThreadByName(name, thread) {
        this.#threadByNameInternal.set(name, thread);
    }
    addEvent(payload) {
        return this.threadById(payload.tid).addEvent(payload);
    }
    sortedThreads() {
        return NamedObject.sort([...this.threads.values()]);
    }
}
exports.Process = Process;
class Thread extends NamedObject {
    #processInternal;
    #eventsInternal;
    #asyncEventsInternal;
    #lastTopLevelEvent;
    constructor(process, id) {
        super(process.getModel(), id);
        this.#processInternal = process;
        this.#eventsInternal = [];
        this.#asyncEventsInternal = [];
        this.#lastTopLevelEvent = null;
    }
    tracingComplete() {
        this.#asyncEventsInternal.sort(Event.compareStartTime);
        this.#eventsInternal.sort(Event.compareStartTime);
        const phases = Phase;
        const stack = [];
        const toDelete = new Set();
        for (let i = 0; i < this.#eventsInternal.length; ++i) {
            const e = this.#eventsInternal[i];
            e.ordinal = i;
            switch (e.phase) {
                case phases.End: {
                    toDelete.add(i); // Mark for removal.
                    // Quietly ignore unbalanced close events, they're legit (we could have missed start one).
                    if (!stack.length) {
                        continue;
                    }
                    const top = stack.pop();
                    if (!top) {
                        continue;
                    }
                    if (top.name !== e.name || top.categoriesString !== e.categoriesString) {
                        console.error('B/E events mismatch at ' + top.startTime + ' (' + top.name + ') vs. ' + e.startTime + ' (' + e.name +
                            ')');
                    }
                    else {
                        top.complete(e);
                    }
                    break;
                }
                case phases.Begin: {
                    stack.push(e);
                    break;
                }
            }
        }
        // Handle Begin events with no matching End.
        // This commonly happens due to a bug in the trace machinery. See crbug.com/982252
        while (stack.length) {
            const event = stack.pop();
            if (event) {
                // Masquerade the event as Instant, so it's rendered to the user.
                // The ideal fix is resolving crbug.com/1021571, but handling that without a perfetto migration appears prohibitive
                event.phase = phases.Instant;
            }
        }
        this.#eventsInternal = this.#eventsInternal.filter((_, idx) => !toDelete.has(idx));
    }
    addEvent(payload) {
        const event = payload.ph === Phase.SnapshotObject ? ObjectSnapshot.fromPayload(payload, this) :
            Event.fromPayload(payload, this);
        if (TracingModel.isTopLevelEvent(event)) {
            // Discard nested "top-level" events.
            const lastTopLevelEvent = this.#lastTopLevelEvent;
            if (lastTopLevelEvent && (lastTopLevelEvent.endTime || 0) > event.startTime) {
                return null;
            }
            this.#lastTopLevelEvent = event;
        }
        this.#eventsInternal.push(event);
        return event;
    }
    addAsyncEvent(asyncEvent) {
        this.#asyncEventsInternal.push(asyncEvent);
    }
    setName(name) {
        super.setName(name);
        this.#processInternal.setThreadByName(name, this);
    }
    process() {
        return this.#processInternal;
    }
    events() {
        return this.#eventsInternal;
    }
    asyncEvents() {
        return this.#asyncEventsInternal;
    }
    removeEventsByName(name) {
        const extracted = [];
        this.#eventsInternal = this.#eventsInternal.filter(e => {
            if (!e) {
                return false;
            }
            if (e.name !== name) {
                return true;
            }
            extracted.push(e);
            return false;
        });
        return extracted;
    }
}
exports.Thread = Thread;
//# sourceMappingURL=TracingModel.js.map