import Widget from "./widget";
import IconSVG from "./icon.svg";
import { WidgetProps } from "widgets/BaseWidget";
import { generateReactKey } from "utils/generators";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Tabs",
  iconSVG: IconSVG,
  defaults: {
    rows: 7,
    columns: 8,
    shouldScrollContents: false,
    widgetName: "Tabs",
    tabs: [
      { label: "Tab 1", id: "tab1", widgetId: "", isVisible: true },
      { label: "Tab 2", id: "tab2", widgetId: "", isVisible: true },
    ],
    shouldShowTabs: true,
    defaultTab: "Tab 1",
    blueprint: {
      operations: [
        {
          type: "MODIFY_PROPS",
          fn: (widget: WidgetProps & { children?: WidgetProps[] }) => {
            const tabs = [...widget.tabs];

            const newTabs = tabs.map((tab: any) => {
              const newTab = { ...tab };
              newTab.widgetId = generateReactKey();
              return newTab;
            });
            const updatePropertyMap = [
              {
                widgetId: widget.widgetId,
                propertyName: "tabs",
                propertyValue: newTabs,
              },
            ];
            return updatePropertyMap;
          },
        },
      ],
    },
    version: 1,
  },
  properties: {
    validations: Widget.getPropertyValidationMap(),
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
