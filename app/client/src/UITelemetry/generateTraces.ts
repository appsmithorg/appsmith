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
import nanoid from "nanoid";
import memoizeOne from "memoize-one";
import { getApplicationParamsFromUrl } from "ee/utils/serviceWorkerUtils";

const GENERATOR_TRACE = "generator-tracer";

export type OtlpSpan = Span;
export type SpanAttributes = Attributes;

const OTLP_SESSION_ID = nanoid();

const getAppParams = memoizeOne(
  (origin: string, pathname: string, search: string) => {
    const applicationParams = getApplicationParamsFromUrl({
      origin,
      pathname,
      search,
    });

    const {
      applicationSlug,
      appMode = "",
      basePageId: pageId,
      branchName,
    } = applicationParams || {};

    return {
      appMode,
      pageId,
      branchName,
      applicationSlug,
    };
  },
);

export const getCommonTelemetryAttributes = () => {
  const { origin, pathname, search } = window.location;
  const appParams = getAppParams(origin, pathname, search);

  return {
    ...appParams,
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
