import { WidgetProps } from "widgets/BaseWidget";
import { BlueprintOperationTypes } from "widgets/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Tabs",
  iconSVG: IconSVG,
  needsMeta: true,
  isCanvas: true,
  defaults: {
    rows: 40,
    columns: 24,
    shouldScrollContents: false,
    widgetName: "Tabs",
    animateLoading: true,
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
      view: [
        {
          type: "CANVAS_WIDGET",
          position: { left: 0, top: 0 },
          props: {
            detachFromLayout: true,
            canExtend: true,
            isVisible: true,
            isDisabled: false,
            shouldScrollContents: false,
            tabId: "tab1",
            tabName: "Tab 1",
            children: [],
            version: 1,
          },
        },
        {
          type: "CANVAS_WIDGET",
          position: { left: 0, top: 0 },
          props: {
            detachFromLayout: true,
            canExtend: true,
            isVisible: true,
            isDisabled: false,
            shouldScrollContents: false,
            tabId: "tab2",
            tabName: "Tab 2",
            children: [],
            version: 1,
          },
        },
      ],
      operations: [
        {
          type: BlueprintOperationTypes.MODIFY_PROPS,
          fn: (widget: WidgetProps & { children?: WidgetProps[] }) => {
            const tabs = Object.values({ ...widget.tabsObj });
            const tabIds: Record<string, string> = (
              widget.children || []
            ).reduce((idsObj, eachChild) => {
              idsObj = { ...idsObj, [eachChild.tabId]: eachChild.widgetId };
              return idsObj;
            }, {});
            const tabsObj = tabs.reduce((obj: any, tab: any) => {
              const newTab = { ...tab };
              newTab.widgetId = tabIds[newTab.id];
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
