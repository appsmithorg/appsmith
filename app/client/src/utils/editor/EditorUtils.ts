import PropertyControlRegistry from "../PropertyControlRegistry";
// import WidgetFactory from "WidgetProvider/factory";
// import Widgets from "widgets";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";
import { registerLayoutComponents } from "layoutSystems/anvil/utils/layouts/layoutUtils";
import widgets from "widgets";

export const editorInitializer = async () => {
  registerWidgets(widgets);
  const propertyPaneObject: any = {};
  for (const widget of widgets) {
    propertyPaneObject[widget.type] = {
      propertyPaneConfig: widget.getPropertyPaneConfig(),
      propertyPaneContentConfig: widget.getPropertyPaneContentConfig(),
      propertyPaneStyleConfig: widget.getPropertyPaneStyleConfig(),
      features: widget.getFeatures(),
    };
  }

  PropertyControlRegistry.registerPropertyControlBuilders();
  // TODO: do this only for anvil.
  registerLayoutComponents();
};
