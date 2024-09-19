import type { OtlpSpan, SpanAttributes } from "./generateTraces";
import { startNestedSpan } from "./generateTraces";
import type { TimeInput } from "@opentelemetry/api";

export interface WebworkerSpanData {
  attributes: SpanAttributes;
  spanName: string;
  startTime: TimeInput;
  endTime: TimeInput;
}

//this is used in webworkers to generate telemetry data
//this telemetry data is pushed to the main thread which is converted
//to regular otlp telemetry data and subsequently exported to our telemetry collector
export const newWebWorkerSpanData = (
  spanName: string,
  attributes: SpanAttributes,
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

export const profileFn = <T>(
  spanName: string,
  attributes: SpanAttributes = {},
  allSpans: Record<string, WebworkerSpanData | SpanAttributes>,
  fn: () => T,
) => {
  const span = newWebWorkerSpanData(spanName, attributes);
  const res: T = fn();

  addEndTimeForWebWorkerSpanData(span);
  allSpans[spanName] = span;

  return res;
};

//convert webworker spans to OTLP spans
export const convertWebworkerSpansToRegularSpans = (
  parentSpan: OtlpSpan,
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

export const filterSpanData = (
  spanData: Record<string, WebworkerSpanData | SpanAttributes>,
): Record<string, WebworkerSpanData> => {
  return Object.keys(spanData)
    .filter((key) => !key.startsWith("__"))
    .reduce<Record<string, WebworkerSpanData>>((obj, key) => {
      obj[key] = spanData[key] as WebworkerSpanData;

      return obj;
    }, {});
};
