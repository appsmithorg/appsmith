import { registerWidgets } from "./WidgetRegistry";
import PropertyControlRegistry from "./PropertyControlRegistry";

export const editorInitializer = async () => {
  registerWidgets();
  PropertyControlRegistry.registerPropertyControlBuilders();

  const moment = await import("moment-timezone");
  moment.tz.setDefault(moment.tz.guess());
};
