import { memoize } from "lodash";
import type { EvaluationError } from "utils/DynamicBindingUtils";

export const getErrorCount = memoize(
  (evalErrors: Record<string, EvaluationError[]>) => {
    return Object.values(evalErrors).reduce(
      (prev, curr) => curr.length + prev,
      0,
    );
  },
  JSON.stringify,
);
