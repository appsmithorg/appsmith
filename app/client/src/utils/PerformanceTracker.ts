import * as Sentry from "@sentry/react";
import { Span, SpanStatus } from "@sentry/tracing";
import _ from "lodash";
import * as log from "loglevel";

export enum PerformanceTransactionName {
  DEPLOY_APPLICATION = "DEPLOY_APPLICATION",
  DATA_TREE_EVALUATION = "DATA_TREE_EVALUATION",
  CONSTRUCT_UNEVAL_TREE = "CONSTRUCT_UNEVAL_TREE",
  CONSTRUCT_CANVAS_DSL = "CONSTRUCT_CANVAS_DSL",
  CREATE_DEPENDENCIES = "CREATE_DEPENDENCIES",
  SORTED_DEPENDENCY_EVALUATION = "SORTED_DEPENDENCY_EVALUATION",
  SET_WIDGET_LOADING = "SET_WIDGET_LOADING",
  VALIDATE_DATA_TREE = "VALIDATE_DATA_TREE",
  EXECUTE_PAGE_LOAD_ACTIONS = "EXECUTE_PAGE_LOAD_ACTIONS",
  EVALUATE_BINDING = "EVALUATE_BINDING",
  ENTITY_EXPLORER_ENTITY = "ENTITY_EXPLORER_ENTITY",
  ENTITY_EXPLORER = "ENTITY_EXPLORER",
  CLOSE_SIDE_PANE = "CLOSE_SIDE_PANE",
  OPEN_ACTION = "OPEN_ACTION",
  EDITOR_MOUNT = "EDITOR_MOUNT",
  SIDE_BAR_MOUNT = "SIDE_BAR_MOUNT",
  CANVAS_MOUNT = "CANVAS_MOUNT",
  EXECUTE_ACTION = "EXECUTE_ACTION",
  CHANGE_API_SAGA = "CHANGE_API_SAGA",
  SYNC_PARAMS_SAGA = "SYNC_PARAMS_SAGA",
  RUN_API_CLICK = "RUN_API_CLICK",
  RUN_QUERY_CLICK = "RUN_QUERY_CLICK",
  FETCH_ACTIONS_API = "FETCH_ACTIONS_API",
  FETCH_PAGE_LIST_API = "FETCH_PAGE_LIST_API",
  FETCH_PAGE_ACTIONS_API = "FETCH_PAGE_ACTIONS_API",
  FETCH_PAGE_API = "FETCH_PAGE_API",
  SAVE_PAGE_API = "SAVE_PAGE_API",
  UPDATE_ACTION_API = "UPDATE_ACTION_API",
  OPEN_PROPERTY_PANE = "OPEN_PROPERTY_PANE",
  REFACTOR_ACTION_NAME = "REFACTOR_ACTION_NAME",
  USER_ME_API = "USER_ME_API",
  SIGN_UP = "SIGN_UP",
  LOGIN_CLICK = "LOGIN_CLICK",
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
  private static perfAsyncMap: Map<string, PerfLog> = new Map();

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
      newTransaction.setData("startData", data);
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
    eventName?: PerformanceTransactionName,
    data?: any,
  ) => {
    if (eventName) {
      const index = _.findLastIndex(
        PerformanceTracker.perfLogQueue,
        (perfLog, i) => {
          return perfLog.eventName === eventName;
        },
      );
      if (index !== -1) {
        for (
          let i = PerformanceTracker.perfLogQueue.length - 1;
          i >= index;
          i--
        ) {
          const perfLog = PerformanceTracker.perfLogQueue.pop();
          if (perfLog) {
            const currentSpan = perfLog.sentrySpan;
            currentSpan.finish();
            if (!perfLog?.skipLog) {
              PerformanceTracker.printDuration(
                perfLog.eventName,
                i + 1,
                currentSpan.startTimestamp,
                currentSpan.endTimestamp,
              );
            }
          }
        }
      }
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

  static startAsyncTracking = (
    eventName: PerformanceTransactionName,
    data?: any,
    uniqueId?: string,
    parentEventId?: string,
    skipLog = false,
  ) => {
    if (!skipLog) {
      log.debug(
        "Async " +
          PerformanceTracker.generateSpaces(0) +
          eventName +
          " Track Transaction ",
      );
    }
    if (!parentEventId) {
      const newTransaction = Sentry.startTransaction({ name: eventName });
      newTransaction.setData("startData", data);
      PerformanceTracker.perfAsyncMap.set(uniqueId ? uniqueId : eventName, {
        sentrySpan: newTransaction,
        eventName: eventName,
        skipLog: skipLog,
      });
    } else {
      const perfLog = PerformanceTracker.perfAsyncMap.get(parentEventId);
      const childSpan = perfLog?.sentrySpan.startChild({
        op: eventName,
        data: data,
      });
      if (childSpan) {
        PerformanceTracker.perfAsyncMap.set(uniqueId ? uniqueId : eventName, {
          sentrySpan: childSpan,
          eventName: eventName,
          skipLog: skipLog,
        });
      }
    }
  };

  static stopAsyncTracking(
    eventName: PerformanceTransactionName,
    data?: any,
    uniqueId?: string,
  ) {
    const perfLog = PerformanceTracker.perfAsyncMap.get(
      uniqueId ? uniqueId : eventName,
    );
    if (perfLog) {
      const currentSpan = perfLog.sentrySpan;
      currentSpan.setData("endData", data);
      currentSpan.finish();
      if (!perfLog?.skipLog) {
        PerformanceTracker.printDuration(
          perfLog.eventName,
          0,
          currentSpan.startTimestamp,
          currentSpan.endTimestamp,
          true,
        );
      }
    }
  }

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
    isAsync?: boolean,
  ) {
    const duration = ((endTime || 0) - startTime) * 1000;
    const spaces = PerformanceTracker.generateSpaces(level);
    log.debug(
      (isAsync ? "Async " : "") +
        spaces +
        eventName +
        " Finish Tracking in " +
        duration +
        "ms",
    );
  }
}

export default PerformanceTracker;
