import { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import { PriorityOrder } from "./dataTypeSortRules";
import {
  AutocompleteDataType,
  Completion,
  createCompletionHeader,
  DataTreeDefEntityInformation,
} from "./TernServer";

interface AutocompleteRule {
  computeScore(completion: Completion): number;
}

/**
 * Set score to -Infinity for suggestions like Table1.selectedRow.address
 * Max score - 0
 * Min score - -Infinity
 */
class NoDeepNestedSuggestionsRule implements AutocompleteRule {
  static threshold = -Infinity;
  computeScore(completion: Completion): number {
    let score = 0;
    if (completion.text.split(".").length > 2)
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
  computeScore(completion: Completion): number {
    let score = 0;
    const entityName = AutocompleteSorter.currentFieldInfo.entityName;
    if (!entityName) return score;
    if (completion.text.startsWith(entityName))
      score = NoSelfReferenceRule.threshold;
    return score;
  }
}

/**
 * Set's threshold value for completions like atob(), btoa() etc.
 * Max score - 10^2
 * Min score - 0
 */
class GlobalJSRule implements AutocompleteRule {
  computeScore(completion: Completion): number {
    let score = 0;
    if (completion.origin === "ecmascript" || completion.origin === "base-64")
      score += 1 << 2;
    return score;
  }
}

/**
 * Set's threshold value for completions like _, moment() etc.
 * Max score - 10^2
 * Min score - 0
 */
class JSLibraryRule implements AutocompleteRule {
  static threshold = 1 ** 3;
  computeScore(completion: Completion): number {
    const score = 0;
    if (!completion.origin) return score;
    if (!completion.origin.startsWith("LIB/")) return score;
    return JSLibraryRule.threshold;
  }
}

/**
 * Set's threshold value for completions like setInterval, clearInterval etc.
 * Max score - 10^4
 * Min score - 0
 */
class DataTreeFunctionRule implements AutocompleteRule {
  computeScore(completion: Completion): number {
    let score = 0;
    if (!(completion.origin === "DATA_TREE.APPSMITH.FUNCTIONS")) return score;
    score = 1 << 4;
    return score;
  }
}

/**
 * Set's threshold value for completions that belong to the dataTree and sets higher score for
 * completions that are not functions
 * Max score - 10^5 + 10^4
 * Min score - 0
 */
class DataTreeRule implements AutocompleteRule {
  static threshold = 1 << 5;
  computeScore(completion: Completion): number {
    let score = 0;
    if (!(completion.origin === "DATA_TREE")) return score;
    score = DataTreeRule.threshold;
    if (completion.type === "FUNCTION") return score;
    return score + DataTreeRule.threshold / 10;
  }
}

/**
 * Set's threshold value for completions that match the expectedValue of the current field.
 * Max score - 10^6
 * Min score - 0
 */
class TypeMatchRule implements AutocompleteRule {
  static threshold = 1 << 6;
  computeScore(completion: Completion): number {
    let score = 0;
    const currentFieldInfo = AutocompleteSorter.currentFieldInfo;
    if (completion.type === currentFieldInfo.expectedType)
      score += TypeMatchRule.threshold;
    return score;
  }
}

/**
 * Set's threshold value for completions that resides in PriorityOrder, eg. selectedRow for Table1.
 * Max score - 10^7
 * Min score - 0
 */
class PriorityMatchRule implements AutocompleteRule {
  static threshold = 1 << 7;
  computeScore(completion: Completion): number {
    let score = 0;
    const { currentFieldInfo } = AutocompleteSorter;
    if (
      PriorityOrder[
        currentFieldInfo.expectedType || AutocompleteDataType.UNKNOWN
      ].includes(completion.text)
    )
      score += PriorityMatchRule.threshold;
    return score;
  }
}

/**
 * Sets threshold value.to completions from the same scop.
 * Max score - 10^8
 * Min score - 0
 */
class ScopeMatchRule implements AutocompleteRule {
  static threshold = 1 << 8;
  computeScore(completion: Completion): number {
    let score = 0;
    if (completion.origin === "[doc]" || completion.origin === "customDataTree")
      score += PriorityMatchRule.threshold;
    return score;
  }
}

export class AutocompleteSorter {
  static entityDefInfo: DataTreeDefEntityInformation | undefined;
  static currentFieldInfo: FieldEntityInformation;
  static sort(
    completions: Completion[],
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
      .map((completion) => new ScoredCompletion(completion))
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
    const sortedCompletions = sortedScoredCompletions.map(
      (comp) => comp.completion,
    );
    if (!shouldComputeBestMatch) return sortedCompletions;
    return bestMatchEndIndex > 0
      ? [
          createCompletionHeader("Best Match"),
          ...sortedCompletions.slice(0, bestMatchEndIndex),
          createCompletionHeader("Search Result"),
          ...sortedCompletions.slice(bestMatchEndIndex),
        ]
      : sortedCompletions;
  }
}

export class ScoredCompletion {
  score = 0;
  static rules = [
    new ScopeMatchRule(),
    new PriorityMatchRule(),
    new TypeMatchRule(),
    new DataTreeRule(),
    new DataTreeFunctionRule(),
    new JSLibraryRule(),
    new GlobalJSRule(),
    new NoDeepNestedSuggestionsRule(),
    new NoSelfReferenceRule(),
  ];
  completion: Completion;

  constructor(completion: Completion) {
    this.completion = completion;
    this.score = this.computeScore();
  }

  private computeScore() {
    let score = 0;
    for (const rule of ScoredCompletion.rules) {
      score += rule.computeScore(this.completion);
    }
    return score;
  }
}
