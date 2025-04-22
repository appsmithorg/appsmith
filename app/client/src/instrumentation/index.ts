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
  InternalLoggerLevel,
  LogLevel,
} from "@grafana/faro-react";
import {
  FaroTraceExporter,
  FaroSessionSpanProcessor,
} from "@grafana/faro-web-tracing";
import log from "loglevel";
import { isTracingEnabled } from "instrumentation/utils";

declare global {
  interface Window {
    faro: Faro | null;
  }
}

const { appVersion, observability } = getAppsmithConfigs();
const { deploymentName, serviceInstanceId, serviceName, tracingUrl } =
  observability;

let faro: Faro | null = null;

if (isTracingEnabled()) {
  const ignoreUrls = ["smartlook.cloud"];
  const internalLoggerLevel =
    log.getLevel() === log.levels.DEBUG
      ? InternalLoggerLevel.ERROR
      : InternalLoggerLevel.OFF;

  try {
    if (!window.faro) {
      faro = initializeFaro({
        url: tracingUrl,
        app: {
          name: serviceName,
          version: appVersion.sha,
          environment: deploymentName,
        },
        instrumentations: [
          new ReactIntegration(),
          ...getWebInstrumentations({}),
        ],
        ignoreUrls,
        consoleInstrumentation: {
          disabledLevels: [
            LogLevel.DEBUG,
            LogLevel.TRACE,
            LogLevel.INFO,
            LogLevel.LOG,
          ],
        },
        trackResources: true,
        trackWebVitalsAttribution: true,
        internalLoggerLevel,
        sessionTracking: {
          generateSessionId: () => {
            // Disabling session tracing will not send any instrumentation data to the grafana backend
            // Instead, hardcoding the session id to a constant value to indirecly disable session tracing
            return "SESSION_ID";
          },
        },
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }

  faro = window.faro;

  const tracerProvider = new WebTracerProvider({
    resource: new Resource({
      [ATTR_DEPLOYMENT_NAME]: deploymentName,
      [ATTR_SERVICE_INSTANCE_ID]: serviceInstanceId,
      [ATTR_SERVICE_NAME]: serviceName,
    }),
  });

  if (faro) {
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
}

export const getTraceAndContext = () => {
  if (!faro) {
    return { trace, context };
  }

  // The return type of getOTEL is OTELApi | undefined so we need to check for undefined
  // return default OTEL context and trace if faro is not initialized
  return faro.api.getOTEL() || { trace, context };
};

export { faro };
