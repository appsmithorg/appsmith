import PropertyControlRegistry from "../PropertyControlRegistry";
// import WidgetFactory from "WidgetProvider/factory";
// import Widgets from "widgets";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";
import { registerLayoutComponents } from "layoutSystems/anvil/utils/layouts/layoutUtils";
import widgets from "widgets";

export const editorInitializer = async () => {
  registerWidgets(widgets);
  PropertyControlRegistry.registerPropertyControlBuilders();
  // TODO: do this only for anvil.
  registerLayoutComponents();
};
