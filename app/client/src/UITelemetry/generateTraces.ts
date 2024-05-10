import type { Span, Attributes, TimeInput } from "@opentelemetry/api";
import { SpanKind } from "@opentelemetry/api";
import { context } from "@opentelemetry/api";
import { trace } from "@opentelemetry/api";

const GENERATOR_TRACE = "generator-tracer";
export function startRootSpan(
  spanName: string,
  spanAttributes?: Attributes,
  startTime?: TimeInput,
) {
  const tracer = trace.getTracer(GENERATOR_TRACE);
  if (!spanName) {
    return;
  }
  const attributes = spanAttributes ?? { attributes: spanAttributes };
  const startTimeAttr = startTime ? { startTime } : {};
  return tracer?.startSpan(spanName, {
    kind: SpanKind.CLIENT,
    ...attributes,
    ...startTimeAttr,
  });
}
export const generateContext = (span: Span) => {
  return trace.setSpan(context.active(), span);
};
export function startNestedSpan(
  spanName: string,
  parentSpan?: Span,
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

export function endSpan(span?: Span) {
  span?.end();
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
