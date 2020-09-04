import * as Sentry from "@sentry/react";
import { Span, Transaction } from "@sentry/tracing";
import { TransactionContext } from "@sentry/types";
import log from "loglevel";

export enum PerformanceTransactionName {
  DEPLOY_APPLICATION = "DEPLOY_APPLICATION",
}

export enum PerformanceSpanName {
  TEST = "TEST",
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
    delete this.transactionIdLookup[transactionId];
    transaction.finish();
  };
}

const monitor = new PerformanceMonitor();
Object.freeze(monitor);

export default monitor;
