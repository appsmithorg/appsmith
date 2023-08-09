/* eslint-disable no-console */
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import type { DerivedPropertiesMap } from "utils/WidgetFactory";
import ContainerWidget from "widgets/ContainerWidget/widget";
import type { AutocompletionDefinitions } from "widgets/constants";

class CanvasWidget extends ContainerWidget {
  static getPropertyPaneConfig() {
    return [];
  }
  static getWidgetType() {
    return "CANVAS_WIDGET";
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {};
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }
  // TODO Find a way to enforce this, (dont let it be set)
  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }
}

export const CONFIG = {
  type: CanvasWidget.getWidgetType(),
  name: "Canvas",
  hideCard: true,
  eagerRender: true,
  defaults: {
    rows: 0,
    columns: 0,
    widgetName: "Canvas",
    version: 1,
    detachFromLayout: true,
    flexLayers: [],
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH,
  },
  properties: {
    derived: CanvasWidget.getDerivedPropertiesMap(),
    default: CanvasWidget.getDefaultPropertiesMap(),
    meta: CanvasWidget.getMetaPropertiesMap(),
    config: CanvasWidget.getPropertyPaneConfig(),
    autocompleteDefinitions: CanvasWidget.getAutocompleteDefinitions(),
  },
};

export default CanvasWidget;
