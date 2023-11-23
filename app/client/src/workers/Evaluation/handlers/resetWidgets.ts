import type {
  PropertyOverrideDependency,
  WidgetConfig,
  WidgetEntity,
} from "@appsmith/entities/DataTree/types";
import type { EvalWorkerSyncRequest, ResetWidgetsRequestData } from "../types";
import { dataTreeEvaluator } from "./evalTree";
import { isWidget } from "@appsmith/workers/Evaluation/evaluationUtils";
import { evalTreeWithChanges } from "../evalTreeWithChanges";

export default function (
  request: EvalWorkerSyncRequest<ResetWidgetsRequestData>,
) {
  const { data } = request;
  if (!dataTreeEvaluator) return;
  try {
    const configTree = dataTreeEvaluator.getConfigTree();
    const unevalTree = dataTreeEvaluator.getOldUnevalTree();
    const pathsToReevaluate: string[][] = [];

    for (const widgetName of data) {
      const unevaluatedWidget = unevalTree[widgetName] as WidgetEntity;
      const evaluatedWidgetConfig = configTree[widgetName] as WidgetConfig;
      if (!unevaluatedWidget || !isWidget(unevaluatedWidget)) continue;
      const widgetDefaultPaths = new Set<string>();

      const { propertyOverrideDependency } = evaluatedWidgetConfig;
      Object.entries(
        propertyOverrideDependency as PropertyOverrideDependency,
      ).forEach(([, dependency]) => {
        if (!dependency.DEFAULT) return;
        widgetDefaultPaths.add(dependency.DEFAULT);
      });
      for (const defaultPath of widgetDefaultPaths) {
        pathsToReevaluate.push([widgetName, defaultPath]);
      }
    }
    evalTreeWithChanges(pathsToReevaluate, [], {
      skipUpdatedPaths: false,
    });
  } catch (e) {}
}
