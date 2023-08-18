import PropertyControlRegistry from "../PropertyControlRegistry";
// import WidgetFactory from "WidgetProvider/factory";
// import Widgets from "widgets";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";

export const editorInitializer = async () => {
  registerWidgets();
  PropertyControlRegistry.registerPropertyControlBuilders();
};
