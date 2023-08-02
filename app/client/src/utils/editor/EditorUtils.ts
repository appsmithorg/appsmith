import { registerWidgets } from "../WidgetRegistry";
import { fetchPlatformWidgetConfigurationOverrides } from "utils/WidgetPlatformOverrides";

import PropertyControlRegistry from "../PropertyControlRegistry";

export const editorInitializer = async () => {
  const widgetConfigurationOverrides = fetchPlatformWidgetConfigurationOverrides()
  registerWidgets(widgetConfigurationOverrides);
  PropertyControlRegistry.registerPropertyControlBuilders();
};
