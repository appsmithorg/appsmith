import * as Sentry from "@sentry/react";
import { Span, Transaction } from "@sentry/tracing";
import { TransactionContext } from "@sentry/types";
import log from "loglevel";

export enum PerformanceTransactionName {
  DEPLOY_APPLICATION = "DEPLOY_APPLICATION",
  RUN_ACTION = "RUN_ACTION",
  PAGE_SWITCH_EDIT = "PAGE_SWITCH_EDIT",
  PAGE_SWITCH_VIEW = "PAGE_SWITCH_VIEW",
  CREATE_ACTION = "CREATE_ACTION",
  CURL_IMPORT = "CURL_IMPORT",
  EXECUTE_WIDGET_ACTION = "EXECUTE_WIDGET_ACTION",
  UPDATE_WIDGET_PROPERTY = "UPDATE_WIDGET_PROPERTY",
}

export enum PerformanceSpanName {
  RUN_ACTION_WAIT_FOR_SAVE = "RUN_ACTION_WAIT_FOR_SAVE",
  DATA_TREE_EVALUATION = "DATA_TREE_EVALUATION",
  DATA_TREE_EVALUATION_CREATE_DEPENDENCIES = "DATA_TREE_EVALUATION_CREATE_DEPENDENCIES",
  DATA_TREE_EVALUATION_SORTED_EVALUATION = "DATA_TREE_EVALUATION_SORTED_EVALUATION",
  DATA_TREE_EVALUATION_SET_LOADING = "DATA_TREE_EVALUATION_SET_LOADING",
  DATA_TREE_EVALUATION_VALIDATE_AND_PARSE = "DATA_TREE_EVALUATION_VALIDATE_AND_PARSE",
  EXECUTE_PAGE_LOAD_ACTIONS = "EXECUTE_PAGE_LOAD_ACTIONS",
  SAVE_PAGE_LAYOUT = "SAVE_PAGE_LAYOUT",
  SAVE_ACTION = "SAVE_ACTION",
}

type TransactionId = string;

export enum PerformanceTagNames {
  PAGE_ID = "pageId",
  APP_ID = "appId",
  APP_MODE = "appMode",
  TRANSACTION_SUCCESS = "transaction.success",
}

class PerformanceMonitor {
  private globalTags: Map<PerformanceTagNames, string> = new Map();
  private transactionIdLookup: Record<TransactionId, Transaction> = {};
  private spans: Map<PerformanceSpanName, Span> = new Map();

  setTag = (tagName: PerformanceTagNames, value: string) => {
    this.globalTags.set(tagName, value);
  };

  startTransaction = (
    name: PerformanceTransactionName,
    otherContext: Partial<TransactionContext> = {},
  ): TransactionId => {
    // Close any existing transaction
    const currentTransaction = Sentry.getCurrentHub()
      .getScope()
      ?.getTransaction();
    if (currentTransaction) {
      log.debug("Force close transaction", currentTransaction);
      currentTransaction.finish();
    }
    // Start new transaction
    const transaction = Sentry.startTransaction({ name, ...otherContext });
    Sentry.configureScope(scope => scope.setSpan(transaction));
    this.globalTags.forEach((value, key) => transaction.setTag(key, value));
    log.debug("Transaction started", transaction);
    const transactionId = transaction.spanId;
    this.transactionIdLookup[transactionId] = transaction as Transaction;
    return transactionId;
  };

  startSpan = (spanName: PerformanceSpanName, transactionId: TransactionId) => {
    if (!(transactionId in this.transactionIdLookup)) {
      log.error(`Transaction ${transactionId} not found for ${spanName}`);
      return;
    }
    const transaction = this.transactionIdLookup[transactionId];
    const span = transaction.startChild({ op: spanName });
    this.spans.set(spanName, span as Span);
    return span;
  };

  attachSpan = (spanName: PerformanceSpanName) => {
    const currentTransaction = Sentry.getCurrentHub()
      .getScope()
      ?.getTransaction();
    if (!currentTransaction) {
      log.debug("No transaction is progress");
      const newTransaction = Sentry.startTransaction({ name: spanName });
      this.spans.set(spanName, newTransaction as Span);
      return newTransaction;
    }
    const span = currentTransaction.startChild({ op: spanName });
    this.spans.set(spanName, span as Span);
    return span;
  };

  endSpan = (spanName: PerformanceSpanName) => {
    const span = this.spans.get(spanName);
    if (!span) {
      log.error(`Span ${spanName} not found`);
      return;
    }
    span.finish();
    this.spans.delete(spanName);
  };

  endTransaction = (transactionId: string, isSuccess?: boolean) => {
    if (!(transactionId in this.transactionIdLookup)) {
      log.error(`Transaction ${transactionId} not found to end it`);
      return;
    }
    const transaction = this.transactionIdLookup[transactionId];
    if (isSuccess !== undefined) {
      transaction.setTag(
        PerformanceTagNames.TRANSACTION_SUCCESS,
        String(isSuccess),
      );
    }
    log.debug("Ending transaction", transaction);
    delete this.transactionIdLookup[transactionId];
    transaction.finish();
  };
}

const monitor = new PerformanceMonitor();
Object.freeze(monitor);

export default monitor;
