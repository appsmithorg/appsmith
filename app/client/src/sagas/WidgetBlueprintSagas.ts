import { WidgetBlueprint } from "reducers/entityReducers/widgetConfigReducer";
import { generateReactKey } from "utils/generators";
import { call } from "redux-saga/effects";

function buildView(view: WidgetBlueprint["view"], widgetId: string) {
  const children = [];
  for (const template of view) {
    //TODO(abhinav): Can we keep rows and size mandatory?
    try {
      children.push({
        widgetId,
        type: template.type,
        leftColumn: template.position.left || 0,
        topRow: template.position.top || 0,
        columns: template.size && template.size.cols,
        rows: template.size && template.size.rows,
        newWidgetId: generateReactKey(),
        props: template.props,
      });
    } catch (e) {
      console.error(e);
    }
  }
  return children;
}

export function* buildWidgetBlueprint(
  blueprint: WidgetBlueprint,
  widgetId: string,
) {
  const widgetProps = yield call(buildView, blueprint.view, widgetId);
  return widgetProps;
}
