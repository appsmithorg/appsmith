import {
  BatchSpanProcessor,
  NodeTracerProvider
} from "@opentelemetry/sdk-trace-node";
import { Resource } from "@opentelemetry/resources";
import { ATTR_DEPLOYMENT_NAME, ATTR_SERVICE_INSTANCE_ID } from "@opentelemetry/semantic-conventions/incubating";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";

const provider = new NodeTracerProvider({
  resource: new Resource({
    [ATTR_DEPLOYMENT_NAME]: `${process.env.APPSMITH_DEPLOYMENT_NAME}`,
    [ATTR_SERVICE_INSTANCE_ID]: `${process.env.NEW_RELIC_METADATA_KUBERNETES_POD_NAME || "appsmith-0"}`,
    [ATTR_SERVICE_NAME]: "rts",
  }),
});

const nrTracesExporter = new OTLPTraceExporter({
  url: `${process.env.APPSMITH_NEW_RELIC_OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
  headers: {
    "api-key": `${process.env.APPSMITH_NEW_RELIC_OTLP_LICENSE_KEY}`,
  },
});

registerInstrumentations({
  instrumentations: [new HttpInstrumentation()],
});

const batchSpanProcessor = new BatchSpanProcessor(
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

provider.addSpanProcessor(batchSpanProcessor);
provider.register();

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

console.log(">>>>>> Tracer initialized");