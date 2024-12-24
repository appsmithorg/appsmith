import type { Attributes } from "@opentelemetry/api";
import type { WebworkerSpanData } from "./types";

//this is used in webworkers to generate telemetry data
//this telemetry data is pushed to the main thread which is converted
//to regular otlp telemetry data and subsequently exported to our telemetry collector
export const newWebWorkerSpanData = (
  spanName: string,
  attributes: Attributes = {},
): WebworkerSpanData => {
  return {
    attributes,
    spanName,
    startTime: Date.now(),
    endTime: Date.now(),
  };
};

const addEndTimeForWebWorkerSpanData = (span: WebworkerSpanData) => {
  span.endTime = Date.now();
};

export const profileAsyncFn = async <T>(
  spanName: string,
  fn: () => Promise<T>,
  allSpans: Record<string, WebworkerSpanData | Attributes>,
  attributes: Attributes = {},
) => {
  const span = newWebWorkerSpanData(spanName, attributes);
  const res: T = await fn();

  addEndTimeForWebWorkerSpanData(span);
  allSpans[spanName] = span;

  return res;
};

export const profileFn = <T>(
  spanName: string,
  attributes: Attributes = {},
  allSpans: Record<string, WebworkerSpanData | Attributes>,
  fn: () => T,
) => {
  const span = newWebWorkerSpanData(spanName, attributes);
  const res: T = fn();

  addEndTimeForWebWorkerSpanData(span);
  allSpans[spanName] = span;

  return res;
};

export const filterSpanData = (
  spanData: Record<string, WebworkerSpanData | Attributes>,
): Record<string, WebworkerSpanData> => {
  return Object.keys(spanData)
    .filter((key) => !key.startsWith("__"))
    .reduce<Record<string, WebworkerSpanData>>((obj, key) => {
      obj[key] = spanData[key] as WebworkerSpanData;

      return obj;
    }, {});
};
