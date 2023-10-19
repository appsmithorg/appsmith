const opentelemetry = require('@opentelemetry/sdk-node');
// import { trace, Span } from '@opentelemetry/api';

console.log("open telemetry is ", opentelemetry, "trace library is ", opentelemetry.tracing.Tracer)
const tracer = opentelemetry.tracing.Tracer.getTracer(
    'instrumentation-scope-name',
    'instrumentation-scope-version',
  );

for(let i = 0; i < 4; i++) {
    tracer.startActiveSpan("console.hello", (span) => {
        console.log(`Hey ${i}`)
        span.end()
    })
}