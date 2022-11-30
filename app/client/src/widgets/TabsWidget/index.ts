import { Colors } from "constants/Colors";
import { WidgetHeightLimits } from "constants/WidgetConstants";
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
  // TODO(abhinav): Default config like these are not serializable
  // So they will not work with Redux state and they might break
  // evaluations. One way to handle these types of properties is to
  // define them in a Map which the platform understands to have
  // them stored only in the WidgetFactory.
  canvasHeightOffset: (props: WidgetProps): number =>
    props.shouldShowTabs === true ? 5 : 0,
  features: {
    dynamicHeight: {
      sectionIndex: 1,
      active: true,
    },
  },
  defaults: {
    rows: WidgetHeightLimits.MIN_CANVAS_HEIGHT_IN_ROWS + 5,
    columns: 24,
    shouldScrollContents: false,
    widgetName: "Tabs",
    animateLoading: true,
    borderWidth: 1,
    borderColor: Colors.GREY_5,
    backgroundColor: Colors.WHITE,
    minDynamicHeight: WidgetHeightLimits.MIN_CANVAS_HEIGHT_IN_ROWS + 5,
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
            bottomRow: WidgetHeightLimits.MIN_CANVAS_HEIGHT_IN_ROWS,
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
            bottomRow: WidgetHeightLimits.MIN_CANVAS_HEIGHT_IN_ROWS,
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
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
  },
};

export default Widget;
