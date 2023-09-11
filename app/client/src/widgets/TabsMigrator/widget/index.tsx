import type { WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import type {
  TabContainerWidgetProps,
  TabsWidgetProps,
} from "widgets/TabsWidget/constants";
import { selectedTabValidation } from "widgets/TabsWidget/widget";
import { migrateTabsData } from "utils/DSLMigrations";
import { cloneDeep, get } from "lodash";
import { ValidationTypes } from "constants/WidgetValidation";
import { generateReactKey } from "utils/generators";
import { EVAL_VALUE_PATH } from "utils/DynamicBindingUtils";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";

class TabsMigratorWidget extends BaseWidget<
  TabsWidgetProps<TabContainerWidgetProps>,
  WidgetState
> {
  static type = "TABS_MIGRATOR_WIDGET";

  static getConfig() {
    return {
      name: "TabsMigrator",
      needsMeta: true,
    };
  }

  static getDefaults() {
    return {
      isLoading: true,
      rows: 1,
      columns: 1,
      widgetName: "Skeleton",
      version: 1,
      animateLoading: true,
    };
  }

  getWidgetView() {
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
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
                    allowedKeys: [
                      {
                        name: "label",
                        type: ValidationTypes.TEXT,
                      },
                      {
                        name: "id",
                        type: ValidationTypes.TEXT,
                        default: generateReactKey(),
                      },
                      {
                        name: "widgetId",
                        type: ValidationTypes.TEXT,
                        default: generateReactKey(),
                      },
                    ],
                  },
                },
              },
            },
          },
          {
            propertyName: "shouldShowTabs",
            helpText:
              "Hides the tabs so that different widgets can be displayed based on the default tab",
            label: "Show tabs",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "defaultTab",
            helpText: "Selects a tab name specified by default",
            placeholderText: "Enter tab name",
            label: "Default tab",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: selectedTabValidation,
                expected: {
                  type: "Tab Name (string)",
                  example: "Tab 1",
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
            dependencies: ["tabsObj", "tabs"],
          },
          {
            helpText: "Enables scrolling for content inside the widget",
            propertyName: "shouldScrollContents",
            label: "Scroll contents",
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
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "animateLoading",
            label: "Animate loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "when the button is clicked",
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
      super.batchUpdateWidgetProperty({
        modify: {
          tabsObj: migratedTabsDsl.tabsObj,
          type: "TABS_WIDGET",
          version: 2,
          dynamicPropertyPathList: migratedTabsDsl.dynamicPropertyPathList,
          dynamicBindingPathList: migratedTabsDsl.dynamicBindingPathList,
        },
        remove: ["tabs"],
      });
    }
  }
}
export default TabsMigratorWidget;
