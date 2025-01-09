import type { ShowPropertyPanePayload } from "../../actions/propertyPaneActions";

export interface TableFilterPaneReduxState {
  isVisible: boolean;
  widgetId?: string;
  lastWidgetId?: string;
  isVisibleBeforeAction?: boolean;
}
