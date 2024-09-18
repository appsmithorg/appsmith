import type {
  Span,
  Attributes,
  TimeInput,
  SpanOptions,
} from "@opentelemetry/api";
import { SpanKind } from "@opentelemetry/api";
import { context } from "@opentelemetry/api";
import { trace } from "@opentelemetry/api";
import {
  deviceType,
  browserName,
  browserVersion,
  osName,
  osVersion,
} from "react-device-detect";
import { APP_MODE } from "entities/App";
import { matchBuilderPath, matchViewerPath } from "constants/routes";
import nanoid from "nanoid";
import memoizeOne from "memoize-one";

const GENERATOR_TRACE = "generator-tracer";

export type OtlpSpan = Span;
export type SpanAttributes = Attributes;

const OTLP_SESSION_ID = nanoid();

const getAppMode = memoizeOne((pathname: string) => {
  const isEditorUrl = matchBuilderPath(pathname);
  const isViewerUrl = matchViewerPath(pathname);

  const appMode = isEditorUrl
    ? APP_MODE.EDIT
    : isViewerUrl
      ? APP_MODE.PUBLISHED
      : "";
  return appMode;
});

export const getCommonTelemetryAttributes = () => {
  const pathname = window.location.pathname;
  const appMode = getAppMode(pathname);

  return {
    appMode,
    deviceType,
    browserName,
    browserVersion,
    otlpSessionId: OTLP_SESSION_ID,
    hostname: window.location.hostname,
    osName,
    osVersion,
  };
};

export function startRootSpan(
  spanName: string,
  spanAttributes: SpanAttributes = {},
  startTime?: TimeInput,
) {
  const tracer = trace.getTracer(GENERATOR_TRACE);
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
  return trace.setSpan(context.active(), span);
};
export function startNestedSpan(
  spanName: string,
  parentSpan: Span,
  spanAttributes: SpanAttributes = {},
  startTime?: TimeInput,
) {
  const parentContext = generateContext(parentSpan);

  const generatorTrace = trace.getTracer(GENERATOR_TRACE);
  const commonAttributes = getCommonTelemetryAttributes();

  const spanOptions: SpanOptions = {
    kind: SpanKind.CLIENT,
    attributes: {
      ...commonAttributes,
      ...spanAttributes,
    },
    startTime,
  };
  return generatorTrace.startSpan(spanName, spanOptions, parentContext);
}

export function endSpan(span?: Span) {
  span?.end();
}

export function setAttributesToSpan(
  span?: Span,
  spanAttributes: SpanAttributes = {},
) {
  span?.setAttributes(spanAttributes);
}

export const startAndEndSpanForFn = <T>(
  spanName: string,
  spanAttributes: SpanAttributes = {},
  fn: () => T,
) => {
  const span = startRootSpan(spanName, spanAttributes);
  const res: T = fn();
  span.end();
  return res;
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function wrapFnWithParentTraceContext(parentSpan: Span, fn: () => any) {
  const parentContext = trace.setSpan(context.active(), parentSpan);
  return context.with(parentContext, fn);
}

export function startAndEndSpan(
  spanName: string,
  startTime: number,
  difference: number,
  spanAttributes: SpanAttributes = {},
) {
  const endTime = startTime + Math.floor(difference);

  const span = startRootSpan(spanName, spanAttributes, startTime);
  span.end(endTime);
}
