import * as Sentry from "@sentry/react";
import { Span, Transaction } from "@sentry/tracing";
import { TransactionContext } from "@sentry/types";
import log from "loglevel";

export enum PerformanceTransactionName {
  DATA_TREE_EVALUATION = "DATA_TREE_EVALUATION",
  API_CALL = "API_CALL",
}

export enum PerformanceSpanName {
  DATA_TREE_EVAL_CREATE_DEPENDENCIES = "DATA_TREE_EVAL_CREATE_DEPENDENCIES",
  DATA_TREE_EVAL_EVALUATE_TREE = "DATA_TREE_EVAL_EVALUATE_TREE",
  DATA_TREE_EVAL_SET_LOADING = "DATA_TREE_EVAL_SET_LOADING",
  DATA_TREE_EVAL_VALIDATE_TREE = "DATA_TREE_EVAL_VALIDATE_TREE",
}

export enum PerformanceTagNames {
  PAGE_ID = "pageId",
  APP_ID = "appId",
  APP_MODE = "appMode",
}

class PerformanceMonitor {
  private transactions: Map<
    PerformanceTransactionName,
    Transaction
  > = new Map();
  private spans: Map<PerformanceSpanName, Span> = new Map();
  private tags: Map<PerformanceTagNames, string> = new Map();

  setTag = (tagName: PerformanceTagNames, value: string) => {
    this.tags.set(tagName, value);
  };

  startTransaction = (
    name: PerformanceTransactionName,
    otherContext: Partial<TransactionContext> = {},
  ) => {
    const transaction = Sentry.startTransaction({ name, ...otherContext });
    this.transactions.set(name, transaction as Transaction);
    this.tags.forEach((value, key) => transaction.setTag(key, value));
    return transaction;
  };

  startSpan = (
    transactionName: PerformanceTransactionName,
    spanName: PerformanceSpanName,
  ) => {
    const transaction = this.transactions.get(transactionName);
    if (!transaction) {
      log.error(`Transaction ${transactionName} not found`);
      return;
    }
    const span = transaction.startChild({ op: spanName });
    this.spans.set(spanName, span as Span);
  };

  setSpanData = (spanName: PerformanceSpanName, data: Record<string, any>) => {
    const span = this.spans.get(spanName);
    if (!span) {
      log.error(`Span ${spanName} not found`);
      return;
    }
    Object.keys(data).forEach(key => {
      const value = data[key];
      span.setData(key, value);
    });
  };

  setTransactionData = (
    transactionName: PerformanceTransactionName,
    data: Record<string, any>,
  ) => {
    const transaction = this.transactions.get(transactionName);
    if (!transaction) {
      log.error(`Transaction ${transactionName} not found`);
      return;
    }
    Object.keys(data).forEach(key => {
      const value = data[key];
      transaction.setData(key, value);
    });
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
  endTransaction = (transactionName: PerformanceTransactionName) => {
    const transaction = this.transactions.get(transactionName);
    if (!transaction) {
      log.error(`Transaction ${transactionName} not found`);
      return;
    }
    transaction.finish();
    this.transactions.delete(transactionName);
  };
}

const monitor = new PerformanceMonitor();
Object.freeze(monitor);

export default monitor;
