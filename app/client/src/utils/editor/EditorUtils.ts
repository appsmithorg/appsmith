import PropertyControlRegistry from "../PropertyControlRegistry";
import WidgetFactory from "WidgetProvider/factory";
import Widgets from "widgets";

export const editorInitializer = async () => {
  WidgetFactory.initialize(Widgets);
  PropertyControlRegistry.registerPropertyControlBuilders();
};
