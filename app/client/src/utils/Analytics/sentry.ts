import * as Sentry from "@sentry/react";
import { getAppsmithConfigs } from "ee/configs";
import log from "loglevel";
import type { User } from "constants/userConstants";

class SentryUtil {
  static init() {
    const { sentry } = getAppsmithConfigs();

    try {
      if (sentry.enabled && !window.Sentry) {
        window.Sentry = Sentry;
        Sentry.init({
          ...sentry,
          beforeSend(event) {
            const exception = SentryUtil.extractSentryException(event);

            if (exception?.type === "ChunkLoadError") {
              // Only log ChunkLoadErrors after the 2 retries
              if (!exception.value?.includes("failed after 2 retries")) {
                return null;
              }
            }

            // Handle Non-Error rejections
            if (exception?.value?.startsWith("Non-Error")) {
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const serializedData: any = event.extra?.__serialized__;

              if (!serializedData) return null; // if no data is attached, ignore error

              const actualErrorMessage = serializedData.error
                ? serializedData.error.message
                : serializedData.message;

              if (!actualErrorMessage) return null; // If no message is attached, ignore error

              // Now modify the original error
              exception.value = actualErrorMessage;
              event.message = actualErrorMessage;
            }

            return event;
          },
          beforeBreadcrumb(breadcrumb) {
            if (
              breadcrumb.category === "console" &&
              breadcrumb.level !== "error"
            ) {
              return null;
            }

            if (breadcrumb.category === "sentry.transaction") {
              return null;
            }

            if (breadcrumb.category === "redux.action") {
              if (
                breadcrumb.data &&
                breadcrumb.data.type === "SET_EVALUATED_TREE"
              ) {
                breadcrumb.data = undefined;
              }
            }

            return breadcrumb;
          },
        });
      }
    } catch (error) {
      log.error("Failed to initialize Sentry:", error);
    }
  }

  public static identifyUser(userId: string, userData: User) {
    const { sentry } = getAppsmithConfigs();

    if (sentry.enabled) {
      Sentry.configureScope(function (scope) {
        scope.setUser({
          id: userId,
          username: userData.username,
          email: userData.email,
        });
      });
    }
  }

  private static extractSentryException(event: Sentry.Event) {
    if (!event.exception) return null;

    const value = event.exception.values ? event.exception.values[0] : null;

    return value;
  }
}

export default SentryUtil;
