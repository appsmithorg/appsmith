import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import ContainerWidget from "widgets/ContainerWidget/widget";
import type { WidgetDefaultProps } from "../WidgetProvider/constants";
import type { AutocompletionDefinitions } from "WidgetProvider/constants";
import type { SetterConfig } from "entities/AppTheming";

/**
 * Please refer to renderAppsmithCanvas in CanvasFactory to see current version of How CanvasWidget is rendered.
 */

class CanvasWidget extends ContainerWidget {
  static type = "CANVAS_WIDGET";

  static getConfig() {
    return {
      name: "Canvas",
      hideCard: true,
      eagerRender: true,
    };
  }

  static getDefaults(): WidgetDefaultProps {
    return {
      rows: 0,
      columns: 0,
      widgetName: "Canvas",
      version: 1,
      detachFromLayout: true,
      flexLayers: [],
      responsiveBehavior: ResponsiveBehavior.Fill,
      minWidth: FILL_WIDGET_MIN_WIDTH,
    };
  }

  static getPropertyPaneConfig() {
    return [];
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {};
  }

  static getSetterConfig(): SetterConfig | null {
    return null;
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }
  // TODO Find a way to enforce this, (dont let it be set)
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }
}

export default CanvasWidget;
