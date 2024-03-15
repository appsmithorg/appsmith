import {
  getFuncExpressionAtPosition,
  getThenCatchBlocksFromQuery,
  getFunctionParams,
  getFunctionBodyStatements,
} from "@shared/ast";
import type { TreeDropdownOption } from "design-system-old";
import { FIELD_CONFIG } from "./Field/FieldConfig";
import { AppsmithFunction, FieldType } from "./constants";
import type { TActionBlock } from "./types";
import {
  getCodeFromMoustache,
  getEvaluationVersion,
  getSelectedFieldFromValue,
  chainableFns,
} from "./utils";

export function codeToAction(
  code: string,
  fieldOptions: TreeDropdownOption[],
  multipleActions = true,
  strict = false,
): TActionBlock {
  const jsCode = getCodeFromMoustache(code);
  const evaluationVersion = getEvaluationVersion();

  const selectedOption = getSelectedFieldFromValue(jsCode, fieldOptions);

  const mainActionType = (selectedOption.type ||
    selectedOption.value ||
    AppsmithFunction.none) as any;

  if (strict) {
    if (mainActionType === AppsmithFunction.none) {
      throw new Error("Invalid action detected");
    }

    // In the action selector field, if we can't find the selected option,
    // it means, we can't render that action correctly in the UI
    const fieldConfig = FIELD_CONFIG[FieldType.ACTION_SELECTOR_FIELD];
    const selectedOptionValue = fieldConfig.getter(jsCode);

    if (!selectedOptionValue) {
      throw new Error("Invalid action detected");
    }
  }

  if (chainableFns.includes(mainActionType) && multipleActions) {
    const successCallback = getFuncExpressionAtPosition(
      jsCode,
      0,
      evaluationVersion,
    );
    const { catch: catchBlock, then: thenBlock } = getThenCatchBlocksFromQuery(
      code,
      evaluationVersion,
    );

    const thenCallbackParams: string[] = getFunctionParams(
      thenBlock,
      evaluationVersion,
    );
    const thenCallbackBlocks = getFunctionBodyStatements(
      thenBlock,
      evaluationVersion,
    );

    const catchCallbackParams: string[] = getFunctionParams(
      catchBlock,
      evaluationVersion,
    );
    const catchCallbackBlocks = getFunctionBodyStatements(
      catchBlock,
      evaluationVersion,
    );

    const successCallbackParams: string[] = getFunctionParams(
      successCallback,
      evaluationVersion,
    );
    const successCallbackBlocks: string[] = getFunctionBodyStatements(
      successCallback,
      evaluationVersion,
    ).map((block: string) => block);

    const errorCallback = getFuncExpressionAtPosition(
      jsCode,
      1,
      evaluationVersion,
    );

    const errorCallbackParams: string[] = getFunctionParams(
      errorCallback,
      evaluationVersion,
    );
    const errorCallbackBlocks = getFunctionBodyStatements(
      errorCallback,
      evaluationVersion,
    ).map((block: string) => block);

    return {
      code: jsCode,
      actionType: mainActionType,
      success: {
        params: [...thenCallbackParams, ...successCallbackParams],
        blocks: [
          ...successCallbackBlocks.map((block: string) => ({
            ...codeToAction(block, fieldOptions, false, strict),
            type: "success" as const,
          })),
          ...thenCallbackBlocks.map((block: string) => ({
            ...codeToAction(block, fieldOptions, false, strict),
            type:
              successCallbackBlocks.length + errorCallbackBlocks.length > 0
                ? ("success" as const)
                : ("then" as const),
          })),
        ],
      },
      error: {
        params: [...catchCallbackParams, ...errorCallbackParams],
        blocks: [
          ...errorCallbackBlocks.map((block: string) => ({
            ...codeToAction(block, fieldOptions, false, strict),
            type: "failure" as const,
          })),
          ...catchCallbackBlocks.map((block: string) => ({
            ...codeToAction(block, fieldOptions, false, strict),
            type:
              successCallbackBlocks.length + errorCallbackBlocks.length > 0
                ? ("failure" as const)
                : ("catch" as const),
          })),
        ],
      },
    };
  }

  return {
    code: jsCode,
    actionType: mainActionType,
    success: { blocks: [] },
    error: { blocks: [] },
  };
}
