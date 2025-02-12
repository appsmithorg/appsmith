import type {
  WidgetEntity,
  WidgetEntityConfig,
  PropertyOverrideDependency,
} from "ee/entities/DataTree/types";
import type { MetaState, WidgetMetaState } from ".";
import type { ReduxAction } from "actions/ReduxActionTypes";
import type { EvalMetaUpdates } from "ee/workers/common/DataTreeEvaluator/types";
import { create } from "mutative";
import { set, unset } from "lodash";
import { klonaRegularWithTelemetry } from "utils/helpers";

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

        resetMetaObj[propertyName] = klonaRegularWithTelemetry(
          defaultPropertyValue,
          "metaReducerUtils.getMetaWidgetResetObj",
        );
      }
    });
  }

  return resetMetaObj;
}

/**
 * When resetWidget is called from eval, we update all the meta values and remove those meta values which are undefined
 */
export function setMetaValuesOnResetFromEval(
  state: MetaState,
  action: ReduxAction<{
    evalMetaUpdates: EvalMetaUpdates;
  }>,
) {
  const { evalMetaUpdates } = action.payload;

  if (!evalMetaUpdates.length) return state;

  const newMetaState = klonaRegularWithTelemetry(
    state,
    "metaReducerUtils.setMetaValuesOnResetFromEval",
  );

  evalMetaUpdates.forEach(({ metaPropertyPath, value, widgetId }) => {
    if (value === undefined) {
      unset(newMetaState, `${widgetId}.${metaPropertyPath.join(".")}`);
    } else {
      set(newMetaState, [widgetId, ...metaPropertyPath], value);
    }
  });

  return newMetaState;
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
  const newMetaState = create(state, (draftMetaState) => {
    evalMetaUpdates.forEach(({ metaPropertyPath, value, widgetId }) => {
      set(draftMetaState, [widgetId, ...metaPropertyPath], value);
    });

    return draftMetaState;
  });

  return newMetaState;
}
