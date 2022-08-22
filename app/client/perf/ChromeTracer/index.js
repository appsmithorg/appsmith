"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = void 0;
const PerformanceModel_1 = require("./chrome-devtools-frontend/PerformanceModel");
const TempFile_1 = require("./chrome-devtools-frontend/TempFile");
const TimelineUIUtils_1 = require("./chrome-devtools-frontend/TimelineUIUtils");
const TracingModel_1 = require("./chrome-devtools-frontend/TracingModel");
const findMainTrack = (performanceModel) => {
    const threads = performanceModel.timelineModel().tracks();
    const mainTrack = threads.find((track) => Boolean(track.type === "MainThread" && track.forMainFrame && track.events.length));
    /**
     * If no main thread could be found, pick the thread with most events
     * captured in it and assume this is the main track.
     */
    if (!mainTrack) {
        return threads
            .slice(1)
            .reduce((curr, com) => curr.events.length > com.events.length ? curr : com, threads[0]);
    }
    return mainTrack;
};
const getMainTrackEvents = (performanceModel) => {
    const mainTrack = findMainTrack(performanceModel);
    return mainTrack.events;
};
const backingStorage = new TempFile_1.TempFileBackingStorage();
const getStats = (eventsJson) => {
    const tracingModel = new TracingModel_1.TracingModel(backingStorage);
    tracingModel.addEvents(eventsJson);
    const performanceModel = new PerformanceModel_1.PerformanceModel();
    performanceModel.setTracingModel(tracingModel);
    const mainTrack = findMainTrack(performanceModel);
    const startTime = performanceModel.timelineModel().minimumRecordTime();
    const endTime = performanceModel.timelineModel().maximumRecordTime();
    // We are facing data mutaion issue in devtools, to avoid it cloning syncEvents
    const syncEvents = mainTrack.syncEvents().slice();
    const window = performanceModel.window();
    console.log((0, TimelineUIUtils_1.statsForTimeRange)(syncEvents, window.left, window.right));
};
exports.getStats = getStats;
//# sourceMappingURL=index.js.map