import { PerformanceModel } from "./chrome-devtools-frontend/PerformanceModel";
import { TempFileBackingStorage } from "./chrome-devtools-frontend/TempFile";
import { statsForTimeRange } from "./chrome-devtools-frontend/TimelineUIUtils";
import { TracingModel } from "./chrome-devtools-frontend/TracingModel";
const findMainTrack = (performanceModel: PerformanceModel) => {
  const threads: any[] = performanceModel.timelineModel().tracks();

  const mainTrack = threads.find((track: any): boolean =>
    Boolean(
      track.type === "MainThread" && track.forMainFrame && track.events.length,
    ),
  );

  /**
   * If no main thread could be found, pick the thread with most events
   * captured in it and assume this is the main track.
   */
  if (!mainTrack) {
    return threads
      .slice(1)
      .reduce(
        (curr: any, com: any): any =>
          curr.events.length > com.events.length ? curr : com,
        threads[0],
      );
  }

  return mainTrack;
};
const getMainTrackEvents = (performanceModel: PerformanceModel) => {
  const mainTrack = findMainTrack(performanceModel);
  return mainTrack.events;
};
const backingStorage = new TempFileBackingStorage();
const eventsJson = require("./chrome-devtools-frontend/test_data.json");
console.log(eventsJson.length);
const getStats = () => {
  const tracingModel = new TracingModel(backingStorage);
  tracingModel.addEvents(eventsJson);
  const performanceModel = new PerformanceModel();
  performanceModel.setTracingModel(tracingModel);
  const mainTrack = findMainTrack(performanceModel);
  const startTime = performanceModel.timelineModel().minimumRecordTime();
  const endTime = performanceModel.timelineModel().maximumRecordTime();

  // We are facing data mutaion issue in devtools, to avoid it cloning syncEvents
  const syncEvents = mainTrack.syncEvents().slice();
  const window = performanceModel.window();
  console.log(statsForTimeRange(syncEvents, window.left, window.right));
};

getStats();
getStats();
getStats();
getStats();
getStats();
