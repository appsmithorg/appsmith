import type { ConfigTree, DataTree } from "@appsmith/entities/DataTree/types";
import { createEvaluationContext } from "workers/Evaluation/evaluate";
import { getActionTriggerFunctionNames } from "@appsmith/workers/Evaluation/fns";

export function getEvaluationContext(
  unevalTree: DataTree,
  configTree: ConfigTree,
  cloudHosting: boolean,
  options: { withFunctions: boolean },
) {
  if (!options.withFunctions)
    return createEvaluationContext({
      dataTree: unevalTree,
      configTree,
      isTriggerBased: false,
      removeEntityFunctions: true,
    });

  const evalContext = createEvaluationContext({
    dataTree: unevalTree,
    configTree,
    isTriggerBased: true,
    removeEntityFunctions: false,
  });

  const platformFnNamesMap = Object.values(
    getActionTriggerFunctionNames(cloudHosting),
  ).reduce(
    (acc, name) => ({ ...acc, [name]: true }),
    {} as { [x: string]: boolean },
  );
  Object.assign(evalContext, platformFnNamesMap);

  return evalContext;
}
