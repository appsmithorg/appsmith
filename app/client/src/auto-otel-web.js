import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { getWebAutoInstrumentations } from "@opentelemetry/auto-instrumentations-web";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { getAppsmithConfigs } from "@appsmith/configs";

const { newRelic } = getAppsmithConfigs();
const { applicationId, otlpLicenseKey } = newRelic;

const NEW_RELIC_OTLP_ENTITY_NAME = "Appsmith Frontend OTLP";
const NEW_RELIC_OTLP_ENDPOINT = "https://otlp.nr-data.net:4318";

const provider = new WebTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: NEW_RELIC_OTLP_ENTITY_NAME,
    [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: applicationId,
    [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
  }),
});

const newRelicExporter = new OTLPTraceExporter({
  url: `${NEW_RELIC_OTLP_ENDPOINT}/v1/traces`,
  headers: {
    "api-key": otlpLicenseKey,
  },
});

const processor = new BatchSpanProcessor(
  newRelicExporter,
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
provider.addSpanProcessor(processor);
provider.register({
  contextManager: new ZoneContextManager(),
});

registerInstrumentations({
  instrumentations: [
    getWebAutoInstrumentations({
      "@opentelemetry/instrumentation-xml-http-request": {
        enabled: true,
      },
      "@opentelemetry/instrumentation-document-load": {
        enabled: true,
      },
      "@opentelemetry/instrumentation-user-interaction": {
        enabled: true,
      },
    }),
  ],
});
