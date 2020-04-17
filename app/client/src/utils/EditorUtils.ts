import WidgetBuilderRegistry from "./WidgetRegistry";
import PropertyControlRegistry from "./PropertyControlRegistry";
import ValidationRegistry from "./ValidationRegistry";
export const editorInitializer = async () => {
  WidgetBuilderRegistry.registerWidgetBuilders();
  PropertyControlRegistry.registerPropertyControlBuilders();
  ValidationRegistry.registerInternalValidators();

  const moment = await import("moment-timezone");
  moment.tz.setDefault(moment.tz.guess());
};
