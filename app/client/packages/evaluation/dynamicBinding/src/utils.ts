import isString from "lodash/isString";
import { DATA_BIND_REGEX } from "./constants";
import { extractIdentifierInfoFromCode } from "@shared/ast";
import {
  convertPathToString,
  EvalErrorTypes,
  RESERVED_KEYWORDS_AND_INDENTIFIERS,
  type BindingsInfo,
  type EvalError,
} from "@evaluation/common";
import { toPath, union } from "lodash";

function isJSAction(entity: { ENTITY_TYPE: string }) {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === "JSACTION"
  );
}

//{{}}{{}}}
export const getDynamicBindings = (
  dynamicString: string,
  entity?: {
    ENTITY_TYPE: string;
  },
): { stringSegments: string[]; jsSnippets: string[] } => {
  // Protect against bad string parse
  if (!dynamicString || !isString(dynamicString)) {
    return { stringSegments: [], jsSnippets: [] };
  }
  const sanitisedString = dynamicString.trim();
  let stringSegments: string[], paths: string[];
  if (entity && isJSAction(entity)) {
    stringSegments = [sanitisedString];
    paths = [sanitisedString];
  } else {
    // Get the {{binding}} bound values
    stringSegments = getDynamicStringSegments(sanitisedString);
    // Get the "binding" path values
    paths = stringSegments.map((segment) => {
      const length = segment.length;
      const matches = isDynamicValue(segment);
      if (matches) {
        return segment.substring(2, length - 2);
      }
      return "";
    });
  }
  return { stringSegments: stringSegments, jsSnippets: paths };
};

//{{}}{{}}}
export function getDynamicStringSegments(dynamicString: string): string[] {
  let stringSegments = [];
  const indexOfDoubleParanStart = dynamicString.indexOf("{{");
  if (indexOfDoubleParanStart === -1) {
    return [dynamicString];
  }
  //{{}}{{}}}
  const firstString = dynamicString.substring(0, indexOfDoubleParanStart);
  firstString && stringSegments.push(firstString);
  let rest = dynamicString.substring(
    indexOfDoubleParanStart,
    dynamicString.length,
  );
  //{{}}{{}}}
  let sum = 0;
  for (let i = 0; i <= rest.length - 1; i++) {
    const char = rest[i];
    const prevChar = rest[i - 1];

    if (char === "{") {
      sum++;
    } else if (char === "}") {
      sum--;
      if (prevChar === "}" && sum === 0) {
        stringSegments.push(rest.substring(0, i + 1));
        rest = rest.substring(i + 1, rest.length);
        if (rest) {
          stringSegments = stringSegments.concat(
            getDynamicStringSegments(rest),
          );
          break;
        }
      }
    }
  }
  if (sum !== 0 && dynamicString !== "") {
    return [dynamicString];
  }
  return stringSegments;
}

export const isDynamicValue = (value: string): boolean =>
  DATA_BIND_REGEX.test(value);

export const extractInfoFromBindings = (
  bindings: string[],
  allKeys: Record<string, true>,
  evaluationVersion: number = 2,
  reservedLibraryIdentifiers: Record<string, boolean> = {},
) => {
  return bindings.reduce(
    (bindingsInfo: BindingsInfo, binding) => {
      try {
        const references = extractInfoFromBinding(
          binding,
          allKeys,
          evaluationVersion,
          reservedLibraryIdentifiers,
        );
        return {
          ...bindingsInfo,
          references: union(bindingsInfo.references, references),
        };
      } catch (error) {
        const newEvalError: EvalError = {
          type: EvalErrorTypes.EXTRACT_DEPENDENCY_ERROR,
          message: (error as Error).message,
          context: {
            script: binding,
          },
        };
        return {
          ...bindingsInfo,
          errors: union(bindingsInfo.errors, [newEvalError]),
        };
      }
    },
    { references: [], errors: [] },
  );
};

/** This function extracts validReferences and invalidReferences from a binding {{}}
 * @param script
 * @param allPaths
 * @returns validReferences - Valid references from bindings
 * invalidReferences- References which are currently invalid
 * @example - For binding {{unknownEntity.name + Api1.name}}, it returns
 * {
 * validReferences:[Api1.name],
 * invalidReferences: [unknownEntity.name]
 * }
 */
const extractInfoFromBinding = (
  script: string,
  allKeys: Record<string, true>,
  evaluationVersion: number = 2,
  reservedLibraryIdentifiers: Record<string, boolean> = {},
) => {
  const { references } = extractIdentifierInfoFromCode(
    script,
    evaluationVersion,
    { ...RESERVED_KEYWORDS_AND_INDENTIFIERS, ...reservedLibraryIdentifiers },
  );
  return getPrunedReferences(references, allKeys);
};

const getPrunedReferences = (
  references: string[],
  allKeys: Record<string, true>,
) => {
  const prunedReferences: Set<string> = new Set<string>();

  references.forEach((reference: string) => {
    // If the identifier exists directly, add it and return
    if (allKeys.hasOwnProperty(reference)) {
      prunedReferences.add(reference);
      return;
    }
    const subpaths = toPath(reference);
    let current = "";
    // We want to keep going till we reach top level, but not add top level
    // Eg: Input1.text should not depend on entire Table1 unless it explicitly asked for that.
    // This is mainly to avoid a lot of unnecessary evals, if we feel this is wrong
    // we can remove the length requirement, and it will still work
    while (subpaths.length > 1) {
      current = convertPathToString(subpaths);
      // We've found the dep, add it and return
      if (allKeys.hasOwnProperty(current)) {
        prunedReferences.add(current);
        return;
      }
      subpaths.pop();
    }
    // If no valid reference is derived, add reference as is
    prunedReferences.add(reference);
  });
  return Array.from(prunedReferences);
};
