// import WidgetFactory from "WidgetProvider/factory";
// import Widgets from "widgets";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";
import { registerLayoutComponents } from "layoutSystems/anvil/utils/layouts/layoutUtils";
import widgets from "widgets";

export const registerEditorWidgets = () => {
  registerWidgets(widgets);
};

export const editorInitializer = async () => {
  registerEditorWidgets();
  // TODO: do this only for anvil.
  registerLayoutComponents();
};
