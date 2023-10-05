import type {
  WidgetEntity,
  WidgetEntityConfig,
  PropertyOverrideDependency,
} from "@appsmith/entities/DataTree/types";
import { klona } from "klona";
import type { MetaState, WidgetMetaState } from ".";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { EvalMetaUpdates } from "@appsmith/workers/common/DataTreeEvaluator/types";
import produce from "immer";
import { set } from "lodash";

export function getMetaWidgetResetObj(
  evaluatedWidget: WidgetEntity | undefined,
  evaluatedWidgetConfig: WidgetEntityConfig,
) {
  // reset widget: sets the meta values to current default values of widget
  const resetMetaObj: WidgetMetaState = {};

  // evaluatedWidget is widget data inside dataTree, this will have latest default values of widget
  if (evaluatedWidget) {
    const { propertyOverrideDependency } = evaluatedWidgetConfig;
    // propertyOverrideDependency has defaultProperty name for each meta property of widget
    Object.entries(
      propertyOverrideDependency as PropertyOverrideDependency,
    ).map(([propertyName, dependency]) => {
      const defaultPropertyValue =
        dependency.DEFAULT && evaluatedWidget[dependency.DEFAULT];
      if (defaultPropertyValue !== undefined) {
        // cloning data to avoid mutation
        resetMetaObj[propertyName] = klona(defaultPropertyValue);
      }
    });
  }
  return resetMetaObj;
}

export function getNextMetaStateWithUpdates(
  state: MetaState,
  action: ReduxAction<{
    evalMetaUpdates: EvalMetaUpdates;
  }>,
) {
  const { evalMetaUpdates } = action.payload;

  if (!evalMetaUpdates.length) return state;

  // if metaObject is updated in dataTree we also update meta values, to keep meta state in sync.
  const newMetaState = produce(state, (draftMetaState) => {
    evalMetaUpdates.forEach(({ metaPropertyPath, value, widgetId }) => {
      set(draftMetaState, [widgetId, ...metaPropertyPath], value);
    });
    return draftMetaState;
  });

  return newMetaState;
}
