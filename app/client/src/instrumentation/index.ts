import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { trace, context } from "@opentelemetry/api";
import { Resource } from "@opentelemetry/resources";
import {
  ATTR_DEPLOYMENT_NAME,
  ATTR_SERVICE_INSTANCE_ID,
} from "@opentelemetry/semantic-conventions/incubating";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { getAppsmithConfigs } from "ee/configs";
import {
  initializeFaro,
  ReactIntegration,
  getWebInstrumentations,
  type Faro,
} from "@grafana/faro-react";
import {
  FaroTraceExporter,
  FaroSessionSpanProcessor,
} from "@grafana/faro-web-tracing";

const { observability } = getAppsmithConfigs();
const { deploymentName, serviceInstanceId, serviceName, tracingUrl } =
  observability;
// This base domain is used to filter out the Smartlook requests from the browser agent
// There are some requests made to subdomains of smartlook.cloud which will also be filtered out
const smartlookBaseDomain = "smartlook.cloud";

let faro: Faro | null = null;

if (tracingUrl) {
  faro = initializeFaro({
    url: tracingUrl,
    app: {
      name: serviceName,
      version: "1.0.0",
      environment: deploymentName,
    },
    instrumentations: [new ReactIntegration(), ...getWebInstrumentations()],
    ignoreUrls: [smartlookBaseDomain],
    consoleInstrumentation: {
      consoleErrorAsLog: true,
    },
    trackResources: true,
    trackWebVitalsAttribution: true,
  });

  const tracerProvider = new WebTracerProvider({
    resource: new Resource({
      [ATTR_DEPLOYMENT_NAME]: deploymentName,
      [ATTR_SERVICE_INSTANCE_ID]: serviceInstanceId,
      [ATTR_SERVICE_NAME]: serviceName,
    }),
  });

  tracerProvider.addSpanProcessor(
    new FaroSessionSpanProcessor(
      new BatchSpanProcessor(new FaroTraceExporter({ ...faro })),
      faro.metas,
    ),
  );

  tracerProvider.register({
    contextManager: new ZoneContextManager(),
  });

  faro.api.initOTEL(trace, context);
}

export const getTraceAndContext = () => {
  if (!faro) {
    return { trace, context };
  }

  // The return type of getOTEL is OTELApi | undefined so we need to check for undefined
  // return default OTEL context and trace if faro is not initialized
  return faro.api.getOTEL() || { trace, context };
};
