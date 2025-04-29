import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
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
import { v4 as uuidv4 } from "uuid";
import { error as errorLogger } from "loglevel";
import type { User } from "constants/userConstants";

class AppsmithTelemetry {
  private faro: Faro | null;
  private ignoreUrls = ["smartlook.cloud"];
  private internalLoggerLevel: InternalLoggerLevel;
  private static instance: AppsmithTelemetry | null;

  constructor() {
    this.internalLoggerLevel =
      log.getLevel() === log.levels.DEBUG
        ? InternalLoggerLevel.ERROR
        : InternalLoggerLevel.OFF;
    const { appVersion, observability } = getAppsmithConfigs();
    const { deploymentName, serviceInstanceId, serviceName, tracingUrl } =
      observability;

    if (isTracingEnabled()) {
      this.faro = initializeFaro({
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
        ignoreUrls: this.ignoreUrls,
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
        internalLoggerLevel: this.internalLoggerLevel,
        sessionTracking: {
          generateSessionId: () => {
            // Disabling session tracing will not send any instrumentation data to the grafana backend
            // Instead, hardcoding the session id to a constant value to indirecly disable session tracing
            return "SESSION_ID";
          },
        },
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
          new BatchSpanProcessor(new FaroTraceExporter({ ...this.faro })),
          this.faro.metas,
        ),
      );

      this.faro.api.initOTEL(trace, context);
    } else {
      this.faro = null;
    }
  }

  public identifyUser(userId: string, userData: User) {
    if (this.faro) {
      this.faro.api.setUser({
        id: userId,
        username: userData.username,
        email: userData.email,
      });
    }
  }

  public static getInstance() {
    if (!AppsmithTelemetry.instance) {
      AppsmithTelemetry.instance = new AppsmithTelemetry();
    }

    return AppsmithTelemetry.instance;
  }

  public getTraceAndContext() {
    const otel = this.faro?.api.getOTEL();

    if (!otel || !this.faro) {
      return { trace, context, pushError: () => {} };
    }

    return {
      trace: otel.trace,
      context: otel.context,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public captureException(exception: any, hint?: Record<string, any>): string {
    const eventId = uuidv4();

    if (!this.faro) {
      return eventId;
    }

    // Exception context in push error is Record<string, string> so we need to convert hint to that format
    const context: Record<string, string> = {};

    // Iterate over hint and convert to Record<string, string>
    if (hint) {
      for (const key in hint) {
        if (typeof hint[key] === "string") {
          context[key] = hint[key];
        } else {
          context[key] = JSON.stringify(hint[key]);
        }
      }
    }

    try {
      this.faro.api.pushError(
        exception instanceof Error ? exception : new Error(String(exception)),
        { type: "error", context: context },
      );
    } catch (error) {
      errorLogger(error);
    }

    return eventId;
  }

  public captureMeasurement(
    value: Record<string, number>,
    context?: Record<string, string>,
  ) {
    if (!this.faro) {
      return;
    }

    //add name inside cotext
    try {
      this.faro.api.pushMeasurement({
        type: "measurement",
        values: value,
        context: context,
      });
    } catch (e) {
      errorLogger(e);
    }
  }
}

export const appsmithTelemetry = AppsmithTelemetry.getInstance();
