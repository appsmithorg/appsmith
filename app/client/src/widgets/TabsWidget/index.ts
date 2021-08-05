import Widget from "./widget";
import IconSVG from "./icon.svg";
import { WidgetProps } from "widgets/BaseWidget";
import { generateReactKey } from "utils/generators";
import {
  BlueprintOperationTypes,
  GRID_DENSITY_MIGRATION_V1,
} from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Tabs",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 7 * GRID_DENSITY_MIGRATION_V1,
    columns: 8 * GRID_DENSITY_MIGRATION_V1,
    shouldScrollContents: false,
    widgetName: "Tabs",
    tabsObj: {
      tab1: {
        label: "Tab 1",
        id: "tab1",
        widgetId: "",
        isVisible: true,
        index: 0,
      },
      tab2: {
        label: "Tab 2",
        id: "tab2",
        widgetId: "",
        isVisible: true,
        index: 1,
      },
    },
    shouldShowTabs: true,
    defaultTab: "Tab 1",
    blueprint: {
      operations: [
        {
          type: BlueprintOperationTypes.MODIFY_PROPS,
          fn: (widget: WidgetProps & { children?: WidgetProps[] }) => {
            const tabs = Object.values({ ...widget.tabsObj });
            const tabsObj = tabs.reduce((obj: any, tab: any) => {
              const newTab = { ...tab };
              newTab.widgetId = generateReactKey();
              obj[newTab.id] = newTab;
              return obj;
            }, {});
            const updatePropertyMap = [
              {
                widgetId: widget.widgetId,
                propertyName: "tabsObj",
                propertyValue: tabsObj,
              },
            ];
            return updatePropertyMap;
          },
        },
      ],
    },
    version: 3,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
