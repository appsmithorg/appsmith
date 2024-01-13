import type { EvaluationError } from "utils/DynamicBindingUtils";
import { memoize } from "lodash";

export const getErrorCount = memoize(
  (evalErrors: Record<string, EvaluationError[]>) => {
    return Object.values(evalErrors).reduce(
      (prev, curr) => curr.length + prev,
      0,
    );
  },
  JSON.stringify,
);
