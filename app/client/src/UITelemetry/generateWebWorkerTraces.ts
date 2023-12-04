import { startNestedSpan } from "./generateTraces";
import type { TimeInput, Attributes, Span } from "@opentelemetry/api";

export interface WebworkerSpan {
  attributes: Attributes;
  spanName: string;
  startTime: TimeInput;
  endTime: TimeInput;
  endSpan?: () => void;
}
//this is used in webworkers to generate telemetry data
//this telemetry data is pushed to the main thread which is converted
//to regular otlp telemetry data and subsequently exported to our telemetry collector
export const startSpan = (
  spanName: string,
  attributes: Attributes,
): WebworkerSpan => {
  return {
    attributes,
    spanName,
    startTime: Date.now(),
    endTime: Date.now(),
    endSpan: function () {
      this.endTime = Date.now();
    },
  };
};

export const startSpansInAnEvaluation = () => {
  return {
    allSpans: [] as WebworkerSpan[],
    profileFn: function (
      spanName: string,
      attributes: Attributes = {},
      fun: (...args: any[]) => any,
    ) {
      const span = startSpan(spanName, attributes);
      const res = fun();
      span.endSpan?.();
      // delete endSpan since it is not serialisable by webworker's postMessage to main thread
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { endSpan, ...rest } = span;
      this.allSpans.push(rest);
      return res;
    },
  };
};

//convert webworker spans to OTLP spans
export const convertWebworkerSpansToRegularSpans = (
  parentSpan: Span,
  allSpans?: WebworkerSpan[],
) => {
  allSpans?.forEach((v) => {
    const { attributes, endTime, spanName, startTime } = v;
    const span = startNestedSpan(spanName, parentSpan, attributes, startTime);
    span?.end(endTime);
  });
};
