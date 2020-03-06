import { WidgetBlueprint } from "reducers/entityReducers/widgetConfigReducer";
import { generateReactKey } from "utils/generators";
import { put, select, call } from "redux-saga/effects";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getWidget } from "sagas/selectors";
import { WidgetProps } from "widgets/BaseWidget";
import { GridDefaults } from "constants/WidgetConstants";

function* buildView(view: WidgetBlueprint["view"], widget: WidgetProps) {
  for (const template of view) {
    try {
      const config = {
        widgetId: widget.widgetId,
        type: template.type,
        leftColumn: template.position.left || 0,
        topRow: template.position.top || 0,
        columns: template.size.cols,
        rows: template.size.rows,
        parentRowSpace: widget.parentRowSpace,
        parentColumnSpace: GridDefaults.DEFAULT_GRID_COLUMNS,
        newWidgetId: generateReactKey(),
        props: template.props,
      };
      yield put({
        type: ReduxActionTypes.WIDGET_ADD_CHILD,
        payload: config,
      });
    } catch (e) {
      console.error(e);
    }
  }
}

export function* buildWidgetBlueprint(
  blueprint: WidgetBlueprint,
  widgetId: string,
) {
  const widget = yield select(getWidget, widgetId);
  yield call(buildView, blueprint.view, widget);
  // // Create actions defined in the blueprint, Make use of
  // // widgetNames for binding replacements
  // yield call(buildActions, blueprint.actions, widgetName);
  // // After actions are created, update the bindings in the widgets with
  // // the correct action Names
  // yield call(bindWidgetPropsToActions, widgets, actionsNames);
}
