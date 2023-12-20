import type { Span, Attributes, HrTime, TimeInput } from "@opentelemetry/api";
import { SpanKind } from "@opentelemetry/api";
import { context } from "@opentelemetry/api";
import { trace } from "@opentelemetry/api";

const GENERATOR_TRACE = "generator-tracer";
export function startRootSpan(spanName: string, spanAttributes?: Attributes) {
  const tracer = trace.getTracer(GENERATOR_TRACE);
  if (!spanName) {
    return;
  }
  const attributes = spanAttributes ?? { attributes: spanAttributes };
  return tracer?.startSpan(spanName, { kind: SpanKind.CLIENT, ...attributes });
}
export const generateContext = (span: Span) => {
  return trace.setSpan(context.active(), span);
};
export function startNestedSpan(
  spanName: string,
  parentSpan: Span,
  spanAttributes?: Attributes,
  startTime?: TimeInput,
) {
  if (!spanName || !parentSpan) {
    // do not generate nested span without parentSpan..we cannot generate context out of it
    return;
  }

  const parentContext = generateContext(parentSpan);

  const generatorTrace = trace.getTracer(GENERATOR_TRACE);

  const attributes = {
    kind: SpanKind.CLIENT,
    ...(startTime ? { startTime } : {}),
    ...(spanAttributes ? { attributes: spanAttributes } : {}),
  };
  return generatorTrace.startSpan(spanName, attributes, parentContext);
}

function convertHighResolutionTimeToEpoch(hr: HrTime) {
  const epochInSeconds = hr[0];
  const millisecondFragment = Math.round(hr[1] / 1000000);
  const epochInMilliseconds = epochInSeconds * 1000 + millisecondFragment;
  return epochInMilliseconds;
}

function addTraceToNewRelicSession(span: any) {
  if (
    !span ||
    !span.startTime ||
    !span.endTime ||
    !span.name ||
    !(window as any)?.newrelic
  ) {
    return;
  }

  //extract timestamp details from the span
  //we have to convert it from HR timestamp to a regular epoch
  const start = convertHighResolutionTimeToEpoch(span.startTime);
  const end = convertHighResolutionTimeToEpoch(span.endTime);
  const spanName = span.name;

  //the new relic window object is attached when the browser script
  (window as any).newrelic.addToTrace({ name: spanName, start, end });
}
export function endSpan(span?: Span) {
  span?.end();

  addTraceToNewRelicSession(span);
}
export function setAttributesToSpan(span: Span, spanAttributes: Attributes) {
  if (!span) {
    return;
  }
  span.setAttributes(spanAttributes);
}

export function wrapFnWithParentTraceContext(parentSpan: Span, fn: () => any) {
  const parentContext = trace.setSpan(context.active(), parentSpan);
  return context.with(parentContext, fn);
}

export type OtlpSpan = Span;
