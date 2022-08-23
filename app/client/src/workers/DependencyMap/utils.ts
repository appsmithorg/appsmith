import { flatten } from "lodash";
import toPath from "lodash/toPath";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";
import { extractIdentifiersFromCode } from "@shared/ast";
import DataTreeEvaluator from "workers/DataTreeEvaluator";
import { convertPathToString } from "../evaluationUtils";

/**
 *
 * @param script
 * @param allPaths
 * @returns references and unreferencedIdentifiers from binding
 */
export const extractInfoFromBinding = (
  script: string,
  allPaths: Record<string, true>,
): { references: string[]; unreferencedIdentifiers: string[] } => {
  const identifiers = extractIdentifiersFromCode(
    script,
    self?.evaluationVersion,
  );
  return extractInfoFromIdentifiers(identifiers, allPaths);
};

/**
 *
 * @param identifiers
 * @param allPaths
 * @returns references and unreferencedIdentifiers from identifiers
 */
export const extractInfoFromIdentifiers = (
  identifiers: string[],
  allPaths: Record<string, true>,
): {
  references: string[];
  unreferencedIdentifiers: string[];
} => {
  const references: Set<string> = new Set<string>();
  const unreferencedIdentifiers: string[] = [];
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
    // If no reference is derived from identifier, add it to the list of unreferencedIdentifiers
    unreferencedIdentifiers.push(identifier);
  });
  return { references: Array.from(references), unreferencedIdentifiers };
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
              extractInfoFromBinding(
                binding,
                dataTreeEvalRef.allKeys,
              ).references.map((reference) => reference.split(".")[0]),
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
