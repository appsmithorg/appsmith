import BaseWidget, { WidgetState } from "widgets/BaseWidget";
import { TabContainerWidgetProps, TabsWidgetProps } from "./TabsWidget";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import withMeta from "widgets/MetaHOC";
import * as Sentry from "@sentry/react";
import { migrateTabsData } from "utils/WidgetPropsUtils";
import { cloneDeep, get } from "lodash";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { EVAL_VALUE_PATH } from "utils/DynamicBindingUtils";

class TabsMigratorWidget extends BaseWidget<
  TabsWidgetProps<TabContainerWidgetProps>,
  WidgetState
> {
  getPageView() {
    return null;
  }
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Takes an array of tab names to render tabs",
            propertyName: "tabs",
            isJSConvertible: true,
            label: "Tabs",
            controlType: "TABS_INPUT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TABS_DATA,
          },
          {
            propertyName: "shouldShowTabs",
            helpText:
              "Hides the tabs so that different widgets can be displayed based on the default tab",
            label: "Show Tabs",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "defaultTab",
            helpText: "Selects a tab name specified by default",
            placeholderText: "Enter tab name",
            label: "Default Tab",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.SELECTED_TAB,
          },
          {
            propertyName: "shouldScrollContents",
            label: "Scroll Contents",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when the button is clicked",
            propertyName: "onTabSelected",
            label: "onTabSelected",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }
  componentDidMount() {
    if (get(this.props, EVAL_VALUE_PATH, false)) {
      const tabsDsl = cloneDeep(this.props);
      const migratedTabsDsl = migrateTabsData(tabsDsl);
      this.batchUpdateWidgetProperty({
        modify: {
          tabsObj: migratedTabsDsl.tabsObj,
          type: WidgetTypes.TABS_WIDGET,
          version: 2,
          dynamicPropertyPathList: migratedTabsDsl.dynamicPropertyPathList,
          dynamicBindingPathList: migratedTabsDsl.dynamicBindingPathList,
        },
        remove: ["tabs"],
      });
    }
  }
  getWidgetType(): WidgetType {
    return "TABS_MIGRATOR_WIDGET";
  }
}
export default TabsMigratorWidget;
export const ProfiledTabsMigratorWidget = Sentry.withProfiler(
  withMeta(TabsMigratorWidget),
);
