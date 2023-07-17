import { registerWidgets } from "../WidgetRegistry";
import PropertyControlRegistry from "../PropertyControlRegistry";

export const editorInitializer = async () => {
  registerWidgets();
  PropertyControlRegistry.registerPropertyControlBuilders();
};
