import * as Sentry from "@sentry/react";
import { Span, SpanStatus } from "@sentry/tracing";
import _ from "lodash";
import * as log from "loglevel";

export enum PerformanceTransactionName {
  DEPLOY_APPLICATION = "DEPLOY_APPLICATION",
  RUN_ACTION = "RUN_ACTION",
  PAGE_SWITCH_EDIT = "PAGE_SWITCH_EDIT",
  PAGE_SWITCH_VIEW = "PAGE_SWITCH_VIEW",
  CREATE_ACTION = "CREATE_ACTION",
  CURL_IMPORT = "CURL_IMPORT",
  EXECUTE_WIDGET_ACTION = "EXECUTE_WIDGET_ACTION",
  RUN_ACTION_WAIT_FOR_SAVE = "RUN_ACTION_WAIT_FOR_SAVE",
  DATA_TREE_EVALUATION = "DATA_TREE_EVALUATION",
  CONSTRUCT_UNEVAL_TREE = "CONSTRUCT_UNEVAL_TREE",
  CONSTRUCT_CANVAS_DSL = "CONSTRUCT_CANVAS_DSL",
  CREATE_DEPENDENCIES = "CREATE_DEPENDENCIES",
  SORTED_DEPENDENCY_EVALUATION = "SORTED_DEPENDENCY_EVALUATION",
  SET_WIDGET_LOADING = "SET_WIDGET_LOADING",
  VALIDATE_DATA_TREE = "VALIDATE_DATA_TREE",
  EXECUTE_PAGE_LOAD_ACTIONS = "EXECUTE_PAGE_LOAD_ACTIONS",
  SAVE_PAGE_LAYOUT = "SAVE_PAGE_LAYOUT",
  SAVE_ACTION = "SAVE_ACTION",
  EVALUATE_BINDING = "EVALUATE_BINDING",
  GENERATE_PROPERTY_PANE_PROPS = "GENERATE_PROPERTY_PANE_PROPS",
  GENERATE_VIEW_MODE_PROPS = "GENERATE_VIEW_MODE_PROPS",
  GENERATE_WIDGET_EDITOR_PROPS = "GENERATE_WIDGET_EDITOR_PROPS",
  ENTITY_EXPLORER_ENTITY = "ENTITY_EXPLORER_ENTITY",
  CLOSE_API = "CLOSE_API",
  OPEN_API = "OPEN_API",
  CANVAS_MOUNT = "CANVAS_MOUNT",
  GENERATE_API_PROPS = "GENERATE_API_PROPS",
  CHANGE_API_SAGA = "CHANGE_API_SAGA",
  SYNC_PARAMS_SAGA = "SYNC_PARAMS_SAGA",
}

export enum PerformanceTagNames {
  PAGE_ID = "pageId",
  APP_ID = "appId",
  APP_MODE = "appMode",
  TRANSACTION_SUCCESS = "transaction.success",
}

export interface PerfLog {
  sentrySpan: Span;
  skipLog?: boolean;
  eventName: string;
}

class PerformanceTracker {
  private static perfLogQueue: PerfLog[] = [];

  static startTracking = (
    eventName: PerformanceTransactionName,
    data?: any,
    skipLog = false,
  ) => {
    const currentTransaction = Sentry.getCurrentHub()
      .getScope()
      ?.getTransaction();
    if (
      PerformanceTracker.perfLogQueue.length === 0 &&
      currentTransaction !== undefined &&
      currentTransaction.status === SpanStatus.Ok
    ) {
      PerformanceTracker.perfLogQueue.push({
        sentrySpan: currentTransaction,
        skipLog: skipLog,
        eventName: eventName,
      });
    }
    if (PerformanceTracker.perfLogQueue.length === 0) {
      if (!skipLog) {
        log.debug(
          PerformanceTracker.generateSpaces(
            PerformanceTracker.perfLogQueue.length + 1,
          ) +
            eventName +
            " Track Transaction ",
        );
      }
      const newTransaction = Sentry.startTransaction({ name: eventName });
      Sentry.getCurrentHub().configureScope(scope =>
        scope.setSpan(newTransaction),
      );
      PerformanceTracker.perfLogQueue.push({
        sentrySpan: newTransaction,
        skipLog: skipLog,
        eventName: eventName,
      });
    } else {
      if (!skipLog) {
        log.debug(
          PerformanceTracker.generateSpaces(
            PerformanceTracker.perfLogQueue.length + 1,
          ) +
            eventName +
            " Track Span ",
        );
      }
      const currentPerfLog =
        PerformanceTracker.perfLogQueue[
          PerformanceTracker.perfLogQueue.length - 1
        ];
      const currentRunningSpan = currentPerfLog.sentrySpan;
      const span = currentRunningSpan.startChild({ op: eventName, data: data });
      PerformanceTracker.perfLogQueue.push({
        sentrySpan: span,
        skipLog: skipLog,
        eventName: eventName,
      });
    }
  };

  static stopTracking = (
    data?: any,
    eventName?: PerformanceTransactionName,
  ) => {
    if (eventName) {
      let index = -1;
      _.forEach(PerformanceTracker.perfLogQueue, (perfLog, i) => {
        if (perfLog.eventName === eventName) {
          index = i;
        }
        if (index !== -1 && i >= index) {
          const currentSpan = perfLog.sentrySpan;
          currentSpan.finish();
          if (!perfLog?.skipLog) {
            PerformanceTracker.printDuration(
              perfLog.eventName,
              PerformanceTracker.perfLogQueue.length + 1,
              currentSpan.startTimestamp,
              currentSpan.endTimestamp,
            );
          }
        }
      });
      PerformanceTracker.perfLogQueue = PerformanceTracker.perfLogQueue.splice(
        index,
      );
    } else {
      const perfLog = PerformanceTracker.perfLogQueue.pop();
      if (perfLog) {
        const currentRunningSpan = perfLog?.sentrySpan;
        currentRunningSpan.setData("endData", data);
        currentRunningSpan.finish();
        if (!perfLog?.skipLog) {
          PerformanceTracker.printDuration(
            perfLog.eventName,
            PerformanceTracker.perfLogQueue.length + 1,
            currentRunningSpan.startTimestamp,
            currentRunningSpan.endTimestamp,
          );
        }
      }
    }
  };

  static generateSpaces(num: number) {
    let str = "";
    for (let i = 0; i < num; i++) {
      str += "\t";
    }
    return str;
  }

  static printDuration(
    eventName: string,
    level: number,
    startTime: number,
    endTime?: number,
  ) {
    const duration = ((endTime || 0) - startTime) * 1000;
    const spaces = PerformanceTracker.generateSpaces(level);
    log.debug(spaces + eventName + " Finish Tracking in " + duration + "ms");
  }
}

export default PerformanceTracker;
