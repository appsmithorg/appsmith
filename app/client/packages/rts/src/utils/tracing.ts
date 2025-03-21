import { trace, context, SpanStatusCode } from "@opentelemetry/api";
import type { Span } from "@opentelemetry/api";

const tracer = trace.getTracer("rts-tracer");

/**
 * Creates and starts a span. If parentSpan is provided, creates a child span.
 * @param name Name of the operation to trace
 * @param attributes Optional attributes for the span
 * @param parentSpan Optional parent span to create child span
 * @returns Span object that must be ended when operation completes
 */
export function startSpan(
  name: string,
  attributes?: Record<string, string | number | boolean>,
  parentSpan?: Span,
): Span {
  const ctx = parentSpan
    ? trace.setSpan(context.active(), parentSpan)
    : undefined;
  const span = tracer.startSpan(name, {}, ctx);

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }

  return span;
}

/**
 * Ends a span and sets error status if error is provided
 * @param span Span to end
 * @param error Optional error to set on span
 */
export function endSpan(span: Span, error?: Error): void {
  if (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }
  span.end();
}
