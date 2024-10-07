import PropertyControlRegistry from "../PropertyControlRegistry";
// import WidgetFactory from "WidgetProvider/factory";
// import Widgets from "widgets";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";
import { registerLayoutComponents } from "layoutSystems/anvil/utils/layouts/layoutUtils";
import widgets from "ee/widgets";

export const registerEditorWidgets = () => {
  registerWidgets(widgets);
};

export const editorInitializer = async () => {
  registerEditorWidgets();
  PropertyControlRegistry.registerPropertyControlBuilders();
  // TODO: do this only for anvil.
  registerLayoutComponents();
};
