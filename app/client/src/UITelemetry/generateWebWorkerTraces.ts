import { startNestedSpan } from "./generateTraces";
import type { TimeInput, Attributes, Span } from "@opentelemetry/api";

export interface WebworkerSpanData {
  attributes: Attributes;
  spanName: string;
  startTime: TimeInput;
  endTime: TimeInput;
}

//this is used in webworkers to generate telemetry data
//this telemetry data is pushed to the main thread which is converted
//to regular otlp telemetry data and subsequently exported to our telemetry collector
export const newWebWorkerSpanData = (
  spanName: string,
  attributes: Attributes,
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

export const profileFn = (
  spanName: string,
  attributes: Attributes = {},
  allSpans: Record<string, WebworkerSpanData>,
  fn: (...args: any[]) => any,
) => {
  const span = newWebWorkerSpanData(spanName, attributes);
  const res = fn();
  addEndTimeForWebWorkerSpanData(span);
  allSpans[spanName] = span;
  return res;
};

//convert webworker spans to OTLP spans
export const convertWebworkerSpansToRegularSpans = (
  parentSpan: Span,
  allSpans: Record<string, WebworkerSpanData> = {},
) => {
  Object.values(allSpans)
    .filter(({ endTime, startTime }) => startTime && endTime)
    .forEach((spanData) => {
      const { attributes, endTime, spanName, startTime } = spanData;
      const span = startNestedSpan(spanName, parentSpan, attributes, startTime);
      span?.end(endTime);
    });
};
