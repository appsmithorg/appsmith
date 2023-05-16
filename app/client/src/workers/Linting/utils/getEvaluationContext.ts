import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { createEvaluationContext } from "workers/Evaluation/evaluate";
import { getActionTriggerFunctionNames } from "@appsmith/workers/Evaluation/fns";

export default function getEvaluationContext(
  unevalTree: DataTree,
  cloudHosting: boolean,
  options: { withFunctions: boolean },
) {
  if (!options.withFunctions)
    return createEvaluationContext({
      dataTree: unevalTree,
      isTriggerBased: false,
      removeEntityFunctions: true,
    });

  const evalContext = createEvaluationContext({
    dataTree: unevalTree,
    isTriggerBased: false,
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
