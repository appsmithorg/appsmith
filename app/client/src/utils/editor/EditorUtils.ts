// import WidgetFactory from "WidgetProvider/factory";
// import Widgets from "widgets";
import { registerWidget } from "WidgetProvider/factory/registrationHelper";
import { registerLayoutComponents } from "layoutSystems/anvil/utils/layouts/layoutUtils";
import { loadAllWidgets } from "widgets";
export const registerAllWidgets = async () => {
  try {
    const loadedWidgets = await loadAllWidgets();

    loadedWidgets.forEach((widget) => {
      registerWidget(widget);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error loading widgets", error);
  }
};

export const registerLayoutComponentsOnly = () => {
  registerLayoutComponents();
};

export const editorInitializer = async () => {
  await registerAllWidgets();
  // TODO: do this only for anvil.
  registerLayoutComponentsOnly();
};
