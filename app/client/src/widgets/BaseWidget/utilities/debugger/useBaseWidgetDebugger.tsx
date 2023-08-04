import type { EvaluationError } from "utils/DynamicBindingUtils";
import { memoize, MemoizedFunction } from "lodash";
import type { ReactNode } from "react";
import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
export interface BaseWidgetDebugger {
  getErrorCount: ((evalErrors: Record<string, EvaluationError[]>) => number) &
    MemoizedFunction;
  addErrorBoundary: (content: ReactNode) => JSX.Element;
}

export const useBaseWidgetDebugger = (): BaseWidgetDebugger => {
  return {
    getErrorCount: memoize((evalErrors: Record<string, EvaluationError[]>) => {
      return Object.values(evalErrors).reduce(
        (prev, curr) => curr.length + prev,
        0,
      );
    }, JSON.stringify),
    addErrorBoundary: (content: ReactNode) => {
      return <ErrorBoundary>{content}</ErrorBoundary>;
    },
  };
};
