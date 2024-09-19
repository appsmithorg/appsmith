import { getEntityNameAndPropertyPath } from "ee/workers/Evaluation/evaluationUtils";
import { get, isEmpty, set } from "lodash";
import type { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import type { LintError } from "utils/DynamicBindingUtils";
import { globalData } from "./globalData";
import lintBindingPath from "./utils/lintBindingPath";
import lintTriggerPath from "./utils/lintTriggerPath";
import lintJSObjectBody from "./utils/lintJSObjectBody";
import sortLintingPathsByType from "./utils/sortLintingPathsByType";
import lintJSObjectProperty from "./utils/lintJSObjectProperty";
import setters from "workers/Evaluation/setters";
import type {
  getLintErrorsFromTreeProps,
  getLintErrorsFromTreeResponse,
} from "./types";

export function getLintErrorsFromTree({
  asyncJSFunctionsInDataFields,
  cloudHosting,
  configTree,
  jsPropertiesState,
  pathsToLint,
  unEvalTree,
}: getLintErrorsFromTreeProps): getLintErrorsFromTreeResponse {
  const lintTreeErrors: LintErrorsStore = {};
  const lintedJSPaths = new Set<string>();

  setters.init(configTree, unEvalTree);
  globalData.initialize(unEvalTree, configTree, cloudHosting);

  const { bindingPaths, jsObjectPaths, triggerPaths } = sortLintingPathsByType(
    pathsToLint,
    unEvalTree,
    configTree,
  );

  // Lint binding paths
  bindingPaths.forEach((bindingPath) => {
    const { entityName } = getEntityNameAndPropertyPath(bindingPath);
    const entity = unEvalTree[entityName];
    const unEvalPropertyValue = get(
      unEvalTree,
      bindingPath,
    ) as unknown as string;
    const lintErrors = lintBindingPath({
      dynamicBinding: unEvalPropertyValue,
      entity,
      fullPropertyPath: bindingPath,
      globalData: globalData.getGlobalData(false),
    });

    set(lintTreeErrors, `["${bindingPath}"]`, lintErrors);
  });

  // Lint TriggerPaths
  triggerPaths.forEach((triggerPath) => {
    const { entityName } = getEntityNameAndPropertyPath(triggerPath);
    const entity = unEvalTree[entityName];
    const unEvalPropertyValue = get(
      unEvalTree,
      triggerPath,
    ) as unknown as string;

    // remove all lint errors from path
    set(lintTreeErrors, `["${triggerPath}"]`, []);
    const lintErrors = lintTriggerPath({
      userScript: unEvalPropertyValue,
      entity,
      globalData: globalData.getGlobalData(true),
    });

    set(lintTreeErrors, `["${triggerPath}"]`, lintErrors);
  });

  // Lint jsobject paths
  if (jsObjectPaths.size) {
    jsObjectPaths.forEach((jsObjectPath) => {
      const { entityName: jsObjectName, propertyPath: jsPropertyName } =
        getEntityNameAndPropertyPath(jsObjectPath);
      const jsObjectState = get(jsPropertiesState, jsObjectName);
      const jsObjectBodyPath = `["${jsObjectName}.body"]`;

      // An empty state shows that there is a parse error in the jsObject or the object is empty, so we lint the entire body
      // instead of an individual properties
      if (isEmpty(jsObjectState)) {
        lintedJSPaths.add(`${jsObjectName}.body`);
        const jsObjectBodyLintErrors = lintJSObjectBody(
          jsObjectName,
          globalData.getGlobalData(true),
        );

        set(lintTreeErrors, jsObjectBodyPath, jsObjectBodyLintErrors);
      } else if (jsPropertyName !== "body") {
        lintedJSPaths.add(jsObjectPath);
        const propertyLintErrors = lintJSObjectProperty(
          jsObjectPath,
          jsObjectState,
          asyncJSFunctionsInDataFields,
        );
        const currentLintErrorsInBody = get(
          lintTreeErrors,
          jsObjectBodyPath,
          [] as LintError[],
        );
        const updatedLintErrors = [
          ...currentLintErrorsInBody,
          ...propertyLintErrors,
        ];

        set(lintTreeErrors, jsObjectBodyPath, updatedLintErrors);
      }
    });
  }

  return {
    errors: lintTreeErrors,
    lintedJSPaths: Array.from(lintedJSPaths),
  };
}
