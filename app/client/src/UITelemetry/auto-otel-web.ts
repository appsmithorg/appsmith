import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import {
  ATTR_DEPLOYMENT_NAME,
  ATTR_SERVICE_INSTANCE_ID,
} from "@opentelemetry/semantic-conventions/incubating";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { getAppsmithConfigs } from "ee/configs";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import {
  AggregationTemporalityPreference,
  OTLPMetricExporter,
} from "@opentelemetry/exporter-metrics-otlp-http";
import { metrics } from "@opentelemetry/api";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { PageLoadInstrumentation } from "./PageLoadInstrumentation";
import { getWebAutoInstrumentations } from "@opentelemetry/auto-instrumentations-web";

enum CompressionAlgorithm {
  NONE = "none",
  GZIP = "gzip",
}
const { newRelic, observability } = getAppsmithConfigs();
const { browserAgentEndpoint, otlpLicenseKey } = newRelic;

const { deploymentName, serviceInstanceId, serviceName } = observability;

// This base domain is used to filter out the Smartlook requests from the browser agent
// There are some requests made to subdomains of smartlook.cloud which will also be filtered out
const smartlookBaseDomain = "smartlook.cloud";

const tracerProvider = new WebTracerProvider({
  resource: new Resource({
    [ATTR_DEPLOYMENT_NAME]: deploymentName,
    [ATTR_SERVICE_INSTANCE_ID]: serviceInstanceId,
    [ATTR_SERVICE_NAME]: serviceName,
  }),
});

const nrTracesExporter = new OTLPTraceExporter({
  url: addPathToCurrentUrl("/monitoring/traces"),
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

tracerProvider.addSpanProcessor(processor);
tracerProvider.register({
  contextManager: new ZoneContextManager(),
});

const nrMetricsExporter = new OTLPMetricExporter({
  compression: CompressionAlgorithm.GZIP,
  temporalityPreference: AggregationTemporalityPreference.DELTA,
  url: addPathToCurrentUrl("/monitoring/metrics"),
  headers: {
    "api-key": otlpLicenseKey,
  },
});

const meterProvider = new MeterProvider({
  resource: new Resource({
    [ATTR_DEPLOYMENT_NAME]: deploymentName,
    [ATTR_SERVICE_INSTANCE_ID]: serviceInstanceId,
    [ATTR_SERVICE_NAME]: serviceName,
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
        addPathToCurrentUrl("/monitoring/traces"),
        addPathToCurrentUrl("/monitoring/metrics"),
        smartlookBaseDomain,
      ],
    }),
    getWebAutoInstrumentations({
      "@opentelemetry/instrumentation-xml-http-request": {
        enabled: true,
      },
    }),
  ],
});

// Replaces the pathname of the current URL with the provided path.
function addPathToCurrentUrl(path: string) {
  const origin = window.location.origin;

  const currentUrl = new URL(origin);

  currentUrl.pathname = path.startsWith("/") ? path : `/${path}`;

  return currentUrl.toString();
}
