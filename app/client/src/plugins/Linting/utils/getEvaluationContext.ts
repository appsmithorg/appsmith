import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeTypes";
import { createEvaluationContext } from "workers/Evaluation/evaluate";
import { getActionTriggerFunctionNames } from "ee/workers/Evaluation/fns";

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
    getActionTriggerFunctionNames(),
  ).reduce(
    (acc, name) => ({ ...acc, [name]: true }),
    {} as { [x: string]: boolean },
  );

  Object.assign(evalContext, platformFnNamesMap);

  return evalContext;
}
