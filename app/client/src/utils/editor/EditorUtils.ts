import PropertyControlRegistry from "../PropertyControlRegistry";
// import WidgetFactory from "WidgetProvider/factory";
// import Widgets from "widgets";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";
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
  console.log("buga", propertyPaneObject);

  PropertyControlRegistry.registerPropertyControlBuilders();
};
