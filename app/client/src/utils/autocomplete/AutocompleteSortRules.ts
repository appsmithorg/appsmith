import type { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  DataTreeFunctionSortOrder,
  PriorityOrder,
  blockedCompletions,
} from "./dataTypeSortRules";
import type {
  Completion,
  DataTreeDefEntityInformation,
  TernCompletionResult,
} from "./CodemirrorTernService";
import { createCompletionHeader } from "./CodemirrorTernService";
import { AutocompleteDataType } from "./AutocompleteDataType";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";

interface AutocompleteRule {
  computeScore(
    completion: Completion<TernCompletionResult>,
    entityInfo?: FieldEntityInformation,
  ): number;
}

/**
 * Order of this enum determines the weight of each rule.
 */
enum RuleWeight {
  GlobalJS = 1,
  JSLibrary,
  DataTreeFunction,
  DataTreeMatch,
  RecentEntityMatch,
  DataTreeEntityNameMatch, // Moved up to reduce weight from 8 to 5
  TypeMatch,
  PriorityMatch,
  ScopeMatch,
}

export class NestedPropertyInsideLiteralRule implements AutocompleteRule {
  computeScore(
    completion: Completion<TernCompletionResult>,
    entityInfo: FieldEntityInformation,
  ): number {
    const { token } = entityInfo;
    const score = 0;

    if (!token) return score;

    const lexical = token?.state?.lexical;

    if (!lexical) return score;

    if (lexical.type === "]" && completion.text.split(".").length > 1) {
      return -Infinity;
    }

    return score;
  }
}

export class AndRule implements AutocompleteRule {
  rules: AutocompleteRule[];
  constructor(rules: AutocompleteRule[]) {
    this.rules = rules;
  }
  computeScore(completion: Completion<TernCompletionResult>): number {
    let score = 0;

    for (const rule of this.rules) {
      const localScore = rule.computeScore(completion);

      if (localScore <= 0) {
        score = 0;
        break;
      }

      score += localScore;
    }

    return score;
  }
}

/**
 * Set score to -Infinity for internal defs to be hidden from autocompletion like $__dropdownOption__$
 * Max score - 0
 * Min score - -Infinity
 */
class HideInternalDefsRule implements AutocompleteRule {
  static threshold = -Infinity;

  computeScore(completion: Completion<TernCompletionResult>): number {
    let score = 0;

    if (completion.text.includes("$__") && completion.text.includes("__$")) {
      score = HideInternalDefsRule.threshold;
    }

    return score;
  }
}

/**
 * Set score to -Infinity for paths to be blocked from autocompletion
 * Max score - 0
 * Min score - -Infinity
 */
class RemoveBlackListedCompletionRule implements AutocompleteRule {
  static threshold = -Infinity;

  computeScore(completion: Completion<TernCompletionResult>): number {
    let score = 0;
    const { currentFieldInfo } = AutocompleteSorter;
    const { blockCompletions } = currentFieldInfo;

    if (blockedCompletions.includes(completion.text)) {
      score = RemoveBlackListedCompletionRule.threshold;

      return score;
    }

    if (blockCompletions) {
      for (let index = 0; index < blockCompletions.length; index++) {
        const { subPath } = blockCompletions[index];

        if (completion.text === subPath && completion.origin !== "DATA_TREE") {
          score = RemoveBlackListedCompletionRule.threshold;
          break;
        }
      }
    }

    return score;
  }
}

/**
 * Set score to -Infinity for suggestions like Table1.selectedRow.address
 * Max score - 0
 * Min score - -Infinity
 */
class NoDeepNestedSuggestionsRule implements AutocompleteRule {
  static threshold = -Infinity;
  computeScore(completion: Completion<TernCompletionResult>): number {
    let score = 0;
    const text = completion.displayText || "";

    if (text.split(".").length > 2)
      score = NoDeepNestedSuggestionsRule.threshold;

    return score;
  }
}

/**
 * Set score to -Infinity for completions like Api1.data when the users is editing Api1's header
 * Max score - 0
 * Min score - -Infinity
 */
class NoSelfReferenceRule implements AutocompleteRule {
  static threshold = -Infinity;
  computeScore(completion: Completion<TernCompletionResult>): number {
    let score = 0;
    const { entityName, propertyPath } = AutocompleteSorter.currentFieldInfo;

    if (!entityName) return score;

    if (
      completion.text === entityName ||
      completion.text === [entityName, propertyPath].join(".")
    )
      score = NoSelfReferenceRule.threshold;

    return score;
  }
}

/**
 * Set's threshold value for completions like atob(), btoa() etc.
 * Max score - 10 - binary
 * Min score - 0
 */
class GlobalJSRule implements AutocompleteRule {
  static threshold = 1 << RuleWeight.GlobalJS;
  computeScore(completion: Completion<TernCompletionResult>): number {
    let score = 0;

    if (completion.origin === "ecmascript" || completion.origin === "base-64")
      score += GlobalJSRule.threshold;

    return score;
  }
}

/**
 * Set's threshold value for completions like _, moment() etc.
 * Max score - 100 - binary
 * Min score - 0
 */
class JSLibraryRule implements AutocompleteRule {
  static threshold = 1 << RuleWeight.JSLibrary;
  computeScore(completion: Completion<TernCompletionResult>): number {
    const score = 0;

    if (!completion.origin) return score;

    if (!completion.origin.startsWith("LIB/")) return score;

    return JSLibraryRule.threshold;
  }
}

/**
 * Set's threshold value for completions like setInterval, clearInterval etc.
 * Max score - 1000 - binary
 * Min score - 0
 */
class DataTreeFunctionRule implements AutocompleteRule {
  static threshold = 1 << RuleWeight.DataTreeFunction;
  computeScore(completion: Completion<TernCompletionResult>): number {
    let score = 0;

    if (!(completion.origin === "DATA_TREE.APPSMITH.FUNCTIONS")) return score;

    score += DataTreeFunctionRule.threshold;
    const rankInSortedList =
      DataTreeFunctionSortOrder.indexOf(completion.text) + 1;

    if (rankInSortedList === 0) return score;

    score += 1 / (DataTreeFunctionRule.threshold * rankInSortedList);

    return score;
  }
}
/**
 * Sets threshold value for completions that are recent entities
 * Max score - 10000 + number
 * Min score - 0
 */
class RecentEntityRule implements AutocompleteRule {
  static threshold = 1 << RuleWeight.RecentEntityMatch;
  computeScore(completion: Completion<TernCompletionResult>): number {
    let score = 0;

    if (completion.recencyWeight) {
      score += RecentEntityRule.threshold + completion.recencyWeight;
    }

    return score;
  }
}

/**
 * Set's threshold value for completions that belong to the dataTree and sets higher score for
 * completions that are not functions
 * Max score - 110000 - binary
 * Min score - 0
 */
class DataTreeRule implements AutocompleteRule {
  static threshold = 1 << RuleWeight.DataTreeMatch;
  computeScore(completion: Completion<TernCompletionResult>): number {
    let score = 0;

    if (!(completion.origin === "DATA_TREE")) return score;

    score = DataTreeRule.threshold;

    if (completion.type === "FUNCTION") return score;

    return score + DataTreeRule.threshold / 2;
  }
}

/**
 * Set's threshold value for completions that match the expectedValue of the current field.
 * Max score - 1000000 - binary
 * Min score - 0
 */
class TypeMatchRule implements AutocompleteRule {
  static threshold = 1 << RuleWeight.TypeMatch;
  computeScore(completion: Completion<TernCompletionResult>): number {
    let score = 0;
    const currentFieldInfo = AutocompleteSorter.currentFieldInfo;

    // Don't increase score for entity names
    if (
      completion.type === currentFieldInfo.expectedType &&
      !completion.isEntityName
    )
      score += TypeMatchRule.threshold;

    return score;
  }
}

/**
 * Set's threshold value for completions that belong to the dataTree and are entity names
 * Max score - 10000000 - binary
 * Min score - 0
 */
class DataTreeEntityNameRule implements AutocompleteRule {
  static threshold = 1 << RuleWeight.DataTreeEntityNameMatch;
  computeScore(completion: Completion<TernCompletionResult>): number {
    let score = 0;

    // Reduce score for entity names instead of increasing it
    if (completion.isEntityName) score -= DataTreeEntityNameRule.threshold;

    return score;
  }
}

/**
 * Set's threshold value for completions that resides in PriorityOrder, eg. selectedRow for Table1.
 * Max score - 100000000 - binary
 * Min score - 0
 */
class PriorityMatchRule implements AutocompleteRule {
  static threshold = 1 << RuleWeight.PriorityMatch;
  computeScore(completion: Completion<TernCompletionResult>): number {
    let score = 0;
    const { currentFieldInfo } = AutocompleteSorter;

    if (!completion.text) return score;

    const relevantText = completion.text.split(".").pop();
    const priorities =
      PriorityOrder[
        currentFieldInfo.expectedType || AutocompleteDataType.UNKNOWN
      ];

    if (relevantText && priorities.includes(relevantText))
      score += PriorityMatchRule.threshold;

    return score;
  }
}

/**
 * Sets threshold value.to completions from the same scope.
 * Max score - 1000000000 - binary
 * Min score - 0
 */
class ScopeMatchRule implements AutocompleteRule {
  static threshold = 1 << RuleWeight.ScopeMatch;
  computeScore(completion: Completion<TernCompletionResult>): number {
    let score = 0;

    if (
      completion.origin?.startsWith("[doc") ||
      completion.origin === "customDataTree"
    )
      score += ScopeMatchRule.threshold;

    return score;
  }
}

class BlockAsyncFnsRule implements AutocompleteRule {
  static threshold = -Infinity;
  static blackList = [
    "setTimeout",
    "clearTimeout",
    "setInterval",
    "clearInterval",
    "postWindowMessage",
    "windowMessageListener",
    "watchPosition",
  ];
  computeScore(
    completion: Completion<TernCompletionResult>,
    entityInfo?: FieldEntityInformation | undefined,
  ): number {
    const score = 0;

    if (completion.type !== AutocompleteDataType.FUNCTION) return score;

    if (!completion.displayText) return score;

    if (entityInfo?.isTriggerPath) {
      // triggerPath = true and expectedType = undefined for JSObjects
      if (!entityInfo.expectedType) return score;

      // triggerPath = true and expectedType = FUNCTION or UNKNOWN for trigger fields.
      if (entityInfo.expectedType === AutocompleteDataType.FUNCTION)
        return score;

      if (entityInfo.expectedType === AutocompleteDataType.UNKNOWN)
        return score;
    }

    const isAsyncFunction =
      completion.data?.type?.endsWith("Promise") ||
      BlockAsyncFnsRule.blackList.includes(completion.displayText);

    if (isAsyncFunction) return BlockAsyncFnsRule.threshold;

    return score;
  }
}

export class AutocompleteSorter {
  static entityDefInfo: DataTreeDefEntityInformation | undefined;
  static currentFieldInfo: FieldEntityInformation;
  static bestMatchEndIndex: number;
  static sort(
    completions: Completion<TernCompletionResult>[],
    currentFieldInfo: FieldEntityInformation,
    entityDefInfo?: DataTreeDefEntityInformation,
    shouldComputeBestMatch = true,
  ) {
    AutocompleteSorter.entityDefInfo = entityDefInfo;
    AutocompleteSorter.currentFieldInfo = currentFieldInfo;

    const sortedScoredCompletions = completions
      .sort((compA, compB) => {
        return compA.text.toLowerCase().localeCompare(compB.text.toLowerCase());
      })
      .map((completion) => new ScoredCompletion(completion, currentFieldInfo))
      .filter((scoredCompletion) => scoredCompletion.score >= 0)
      .sort(
        (scoredCompletionA, scoredCompletionB) =>
          scoredCompletionB.score - scoredCompletionA.score,
      );
    const bestMatchThreshold = TypeMatchRule.threshold;
    const bestMatchEndIndex = Math.min(
      sortedScoredCompletions.findIndex(
        (sortedCompletion) => sortedCompletion.score < bestMatchThreshold,
      ),
      3,
    );

    AutocompleteSorter.bestMatchEndIndex = bestMatchEndIndex;
    const sortedCompletions = sortedScoredCompletions.map(
      (comp) => comp.completion,
    );

    if (!shouldComputeBestMatch) return sortedCompletions;

    return bestMatchEndIndex > 0
      ? [
          createCompletionHeader("Best match"),
          ...sortedCompletions.slice(0, bestMatchEndIndex),
          createCompletionHeader("Search results"),
          ...sortedCompletions.slice(bestMatchEndIndex),
        ]
      : sortedCompletions;
  }
}

/**
 * Set score to -Infinity for paths to be blocked from autocompletion
 * Max score - 0
 * Min score - -Infinity
 * respective module inputs should not get module as autocompletion option
 */
class RemoveDependentEntityBlackListedCompletionRule
  implements AutocompleteRule
{
  static threshold = -Infinity;

  computeScore(completion: Completion<TernCompletionResult>): number {
    let score = 0;
    const { currentFieldInfo } = AutocompleteSorter;
    const { blockCompletions } = currentFieldInfo;

    if (
      blockCompletions &&
      currentFieldInfo.entityType === ENTITY_TYPE.MODULE_INPUT
    ) {
      for (let index = 0; index < blockCompletions.length; index++) {
        const { subPath } = blockCompletions[index];

        if (completion.text === subPath) {
          score = RemoveDependentEntityBlackListedCompletionRule.threshold;
          break;
        }
      }
    }

    return score;
  }
}

export class ScoredCompletion {
  score = 0;
  static rules = [
    new BlockAsyncFnsRule(),
    new NoDeepNestedSuggestionsRule(),
    new NoSelfReferenceRule(),
    new ScopeMatchRule(),
    new PriorityMatchRule(),
    new DataTreeEntityNameRule(),
    new TypeMatchRule(),
    new DataTreeRule(),
    new RecentEntityRule(),
    new DataTreeFunctionRule(),
    new JSLibraryRule(),
    new GlobalJSRule(),
    new RemoveBlackListedCompletionRule(),
    new HideInternalDefsRule(),
    new NestedPropertyInsideLiteralRule(),
    new RemoveDependentEntityBlackListedCompletionRule(),
  ];
  completion: Completion<TernCompletionResult>;

  constructor(
    completion: Completion<TernCompletionResult>,
    currentFieldInfo: FieldEntityInformation,
  ) {
    this.completion = completion;
    this.score = this.computeScore(currentFieldInfo);
  }

  private computeScore(currentFieldInfo: FieldEntityInformation) {
    let score = 0;

    for (const rule of ScoredCompletion.rules) {
      score += rule.computeScore(this.completion, currentFieldInfo);

      if (score === -Infinity) break;
    }

    return score;
  }
}
