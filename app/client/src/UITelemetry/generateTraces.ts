import type {
  Span,
  Attributes,
  TimeInput,
  SpanOptions,
} from "@opentelemetry/api";
import { SpanKind } from "@opentelemetry/api";
import { context } from "@opentelemetry/api";
import { trace } from "@opentelemetry/api";
import { deviceType } from "react-device-detect";

import { APP_MODE } from "entities/App";
import { matchBuilderPath, matchViewerPath } from "constants/routes";

const GENERATOR_TRACE = "generator-tracer";

export type OtlpSpan = Span;
export type SpanAttributes = Attributes;

const getCommonTelemetryAttributes = () => {
  const pathname = window.location.pathname;
  const isEditorUrl = matchBuilderPath(pathname);
  const isViewerUrl = matchViewerPath(pathname);

  const appMode = isEditorUrl
    ? APP_MODE.EDIT
    : isViewerUrl
      ? APP_MODE.PUBLISHED
      : "";

  return {
    appMode,
    deviceType,
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

export function endSpan(span: Span) {
  span.end();
}

export function setAttributesToSpan(
  span: Span,
  spanAttributes: SpanAttributes,
) {
  span.setAttributes(spanAttributes);
}

export function wrapFnWithParentTraceContext(parentSpan: Span, fn: () => any) {
  const parentContext = trace.setSpan(context.active(), parentSpan);
  return context.with(parentContext, fn);
}
