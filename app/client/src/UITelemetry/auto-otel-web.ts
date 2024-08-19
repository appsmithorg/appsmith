import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { Resource } from "@opentelemetry/resources";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_SERVICE_INSTANCE_ID,
} from "@opentelemetry/semantic-conventions";
import { getAppsmithConfigs } from "ee/configs";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import {
  OTLPMetricExporter,
  AggregationTemporalityPreference,
} from "@opentelemetry/exporter-metrics-otlp-http";
import type { Context, TextMapSetter } from "@opentelemetry/api";
import { metrics } from "@opentelemetry/api";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { PageLoadInstrumentation } from "./PageLoadInstrumentation";

enum CompressionAlgorithm {
  NONE = "none",
  GZIP = "gzip",
}
const { newRelic } = getAppsmithConfigs();
const {
  applicationId,
  browserAgentEndpoint,
  otlpEndpoint,
  otlpLicenseKey,
  otlpServiceName,
} = newRelic;

// This base domain is used to filter out the Smartlook requests from the browser agent
// There are some requests made to subdomains of smartlook.cloud which will also be filtered out
const smartlookBaseDomain = "smartlook.cloud";

const tracerProvider = new WebTracerProvider({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: otlpServiceName,
    [SEMRESATTRS_SERVICE_INSTANCE_ID]: applicationId,
    [SEMRESATTRS_SERVICE_VERSION]: "1.0.0",
  }),
});

const nrTracesExporter = new OTLPTraceExporter({
  url: `${otlpEndpoint}/v1/traces`,
  compression: CompressionAlgorithm.GZIP,
  headers: {
    "api-key": otlpLicenseKey,
  },
});

const processor = new BatchSpanProcessor(
  nrTracesExporter,
  //Optional BatchSpanProcessor Configurations
  {
    // The maximum queue size. After the size is reached spans are dropped.
    maxQueueSize: 100,
    // The maximum batch size of every export. It must be smaller or equal to maxQueueSize.
    maxExportBatchSize: 50,
    // The interval between two consecutive exports
    scheduledDelayMillis: 500,
    // How long the export can run before it is cancelled
    exportTimeoutMillis: 30000,
  },
);

const W3C_OTLP_TRACE_HEADER = "traceparent";
const CUSTOM_OTLP_TRACE_HEADER = "traceparent-otlp";
//We are overriding the default header "traceparent" used for trace context because the browser
// agent shares the same header's distributed tracing
class CustomW3CTraceContextPropagator extends W3CTraceContextPropagator {
  inject(
    context: Context,
    carrier: Record<string, unknown>,
    setter: TextMapSetter,
  ) {
    // Call the original inject method to get the default traceparent header
    super.inject(context, carrier, setter);

    // Modify the carrier to use a different header
    if (carrier[W3C_OTLP_TRACE_HEADER]) {
      carrier[CUSTOM_OTLP_TRACE_HEADER] = carrier[W3C_OTLP_TRACE_HEADER];
      delete carrier[W3C_OTLP_TRACE_HEADER]; // Remove the original traceparent header
    }
  }
}

tracerProvider.addSpanProcessor(processor);
tracerProvider.register({
  contextManager: new ZoneContextManager(),
  propagator: new CustomW3CTraceContextPropagator(),
});

const nrMetricsExporter = new OTLPMetricExporter({
  compression: CompressionAlgorithm.GZIP,
  temporalityPreference: AggregationTemporalityPreference.DELTA,
  url: `${otlpEndpoint}/v1/metrics`,
  headers: {
    "api-key": otlpLicenseKey,
  },
});

const meterProvider = new MeterProvider({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: otlpServiceName,
    [SEMRESATTRS_SERVICE_INSTANCE_ID]: applicationId,
    [SEMRESATTRS_SERVICE_VERSION]: "1.0.0",
  }),
  readers: [
    new PeriodicExportingMetricReader({
      exporter: nrMetricsExporter,
      exportIntervalMillis: 30000, // Adjust the export interval as needed
    }),
  ],
});

// Register the MeterProvider globally
metrics.setGlobalMeterProvider(meterProvider);

registerInstrumentations({
  tracerProvider,
  meterProvider,
  instrumentations: [
    new PageLoadInstrumentation({
      ignoreResourceUrls: [
        browserAgentEndpoint,
        otlpEndpoint,
        smartlookBaseDomain,
      ],
    }),
  ],
});
