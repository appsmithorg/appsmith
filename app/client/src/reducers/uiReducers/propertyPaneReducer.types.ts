export interface SelectedPropertyPanel {
  [path: string]: number;
}

export interface PropertyPaneReduxState {
  widgetId?: string;
  isVisible: boolean;
  lastWidgetId?: string;
  isVisibleBeforeAction?: boolean;
  isNew: boolean;
  selectedPropertyPanel: SelectedPropertyPanel;
  propertyControlId?: string;
  widgetChildProperty?: string;
  width: number;
  focusedProperty?: string;
}
