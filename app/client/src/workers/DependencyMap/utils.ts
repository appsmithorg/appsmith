import { flatten } from "lodash";
import toPath from "lodash/toPath";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";
import { extractIdentifiersFromCode } from "workers/ast";
import DataTreeEvaluator from "workers/DataTreeEvaluator";
import { convertPathToString } from "../evaluationUtils";

export const extractReferencesFromBinding = (
  script: string,
  allPaths: Record<string, true>,
): string[] => {
  const references: Set<string> = new Set<string>();
  const identifiers = extractIdentifiersFromCode(script);

  identifiers.forEach((identifier: string) => {
    // If the identifier exists directly, add it and return
    if (allPaths.hasOwnProperty(identifier)) {
      references.add(identifier);
      return;
    }
    const subpaths = toPath(identifier);
    let current = "";
    // We want to keep going till we reach top level, but not add top level
    // Eg: Input1.text should not depend on entire Table1 unless it explicitly asked for that.
    // This is mainly to avoid a lot of unnecessary evals, if we feel this is wrong
    // we can remove the length requirement, and it will still work
    while (subpaths.length > 1) {
      current = convertPathToString(subpaths);
      // We've found the dep, add it and return
      if (allPaths.hasOwnProperty(current)) {
        references.add(current);
        return;
      }
      subpaths.pop();
    }
  });
  return Array.from(references);
};

/**
 *
 * @param propertyBindings
 * @returns list of entities referenced in propertyBindings
 * Eg. [Api1.run(), Api2.data, Api1.data] => [Api1, Api2]
 */
export const getEntityReferencesFromPropertyBindings = (
  propertyBindings: string[],
  dataTreeEvalRef: DataTreeEvaluator,
): string[] => {
  return flatten(
    propertyBindings.map((binding) => {
      {
        try {
          return [
            ...new Set(
              extractReferencesFromBinding(
                binding,
                dataTreeEvalRef.allKeys,
              ).map((reference) => reference.split(".")[0]),
            ),
          ];
        } catch (error) {
          dataTreeEvalRef.errors.push({
            type: EvalErrorTypes.EXTRACT_DEPENDENCY_ERROR,
            message: (error as Error).message,
            context: {
              script: binding,
            },
          });
          return [];
        }
      }
    }),
  );
};
