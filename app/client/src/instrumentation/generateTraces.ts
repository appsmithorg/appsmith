import type {
  Span,
  Attributes,
  TimeInput,
  SpanOptions,
} from "@opentelemetry/api";
import { SpanKind } from "@opentelemetry/api";
import { getTraceAndContext } from "./index";
import type { WebworkerSpanData } from "./types";
import { getCommonTelemetryAttributes } from "./utils";

const { context, trace } = getTraceAndContext();

const DEFAULT_TRACE = "default";

export function startRootSpan(
  spanName: string,
  spanAttributes: Attributes = {},
  startTime?: TimeInput,
) {
  const tracer = trace.getTracer(DEFAULT_TRACE);
  const commonAttributes = getCommonTelemetryAttributes();

  return tracer.startSpan(spanName, {
    kind: SpanKind.CLIENT,
    attributes: {
      ...commonAttributes,
      ...spanAttributes,
    },
    startTime,
  });
}

export const generateContext = (span: Span) => {
  if (!context) {
    return;
  }

  return trace?.setSpan(context.active(), span);
};

export function startNestedSpan(
  spanName: string,
  parentSpan: Span,
  spanAttributes: Attributes = {},
  startTime?: TimeInput,
) {
  const parentContext = generateContext(parentSpan);

  const generatorTrace = trace.getTracer(DEFAULT_TRACE);
  const commonAttributes = getCommonTelemetryAttributes();

  const spanOptions: SpanOptions = {
    kind: SpanKind.CLIENT,
    attributes: {
      ...commonAttributes,
      ...spanAttributes,
    },
    startTime,
  };

  return generatorTrace?.startSpan(spanName, spanOptions, parentContext);
}

export function endSpan(span?: Span) {
  span?.end();
}

export function setAttributesToSpan(
  span?: Span,
  spanAttributes: Attributes = {},
) {
  span?.setAttributes(spanAttributes);
}

export const startAndEndSpanForFn = <T>(
  spanName: string,
  spanAttributes: Attributes = {},
  fn: () => T,
) => {
  const span = startRootSpan(spanName, spanAttributes);
  const res: T = fn();

  span?.end();

  return res;
};

export function startAndEndSpan(
  spanName: string,
  startTime: number,
  difference: number,
  spanAttributes: Attributes = {},
) {
  const endTime = startTime + Math.floor(difference);

  const span = startRootSpan(spanName, spanAttributes, startTime);

  span?.end(endTime);
}

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
