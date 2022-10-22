import React from "react";
import { find } from "lodash";
import TabsComponent from "../component";
import BaseWidget, { WidgetState } from "../../BaseWidget";
import WidgetFactory from "utils/WidgetFactory";
import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { TabContainerWidgetProps, TabsWidgetProps } from "../constants";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { WidgetProperties } from "selectors/propertyPaneSelectors";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import derivedProperties from "./parseDerivedProperties";

export function selectedTabValidation(
  value: unknown,
  props: TabContainerWidgetProps,
): ValidationResponse {
  const tabs: Array<{
    label: string;
    id: string;
  }> = props.tabsObj ? Object.values(props.tabsObj) : props.tabs || [];
  const tabNames = tabs.map((i: { label: string; id: string }) => i.label);
  return {
    isValid: value === "" ? true : tabNames.includes(value as string),
    parsed: value,
    messages: [`Tab name ${value} does not exist`],
  };
}
class TabsWidget extends BaseWidget<
  TabsWidgetProps<TabContainerWidgetProps>,
  WidgetState
> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            propertyName: "tabsObj",
            isJSConvertible: false,
            label: "Tabs",
            helpText: "Tabs",
            controlType: "TABS_INPUT",
            isBindProperty: false,
            isTriggerProperty: false,
            updateRelatedWidgetProperties: (
              propertyPath: string,
              propertyValue: string,
              props: WidgetProperties,
            ) => {
              const propertyPathSplit = propertyPath.split(".");
              const property = propertyPathSplit.pop();
              if (property === "label") {
                const itemId = propertyPathSplit.pop() || "";
                const item = props.tabsObj[itemId];
                if (item) {
                  return [
                    {
                      widgetId: item.widgetId,
                      updates: {
                        modify: {
                          tabName: propertyValue,
                        },
                      },
                    },
                  ];
                }
              }
              return [];
            },
            panelConfig: {
              editableTitle: true,
              titlePropertyName: "label",
              panelIdPropertyName: "id",
              updateHook: (
                props: any,
                propertyPath: string,
                propertyValue: string,
              ) => {
                return [
                  {
                    propertyPath,
                    propertyValue,
                  },
                ];
              },
              children: [
                {
                  sectionName: "General",
                  children: [
                    {
                      propertyName: "isVisible",
                      label: "Visible",
                      helpText: "Controls the visibility of the tab",
                      controlType: "SWITCH",
                      useValidationMessage: true,
                      isJSConvertible: true,
                      isBindProperty: true,
                      isTriggerProperty: false,
                      validation: { type: ValidationTypes.BOOLEAN },
                    },
                  ],
                },
              ],
            },
          },
          {
            propertyName: "defaultTab",
            helpText: "Selects a tab name specified by default",
            placeholderText: "Tab 1",
            label: "Default Tab",
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
              dependentPaths: ["tabsObj", "tabs"],
            },
            dependencies: ["tabsObj", "tabs"],
          },
        ],
      },
      {
        sectionName: "General",
        children: [
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
            helpText: "Enables scrolling for content inside the widget",
            propertyName: "shouldScrollContents",
            label: "Scroll Contents",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
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
        ],
      },
      {
        sectionName: "Events",
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

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Colors, Borders and Shadows",
        children: [
          {
            propertyName: "accentColor",
            helpText: "Sets the color of the selected tab's underline ",
            label: "Accent Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Use a html color name, HEX, RGB or RGBA value",
            placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
            propertyName: "backgroundColor",
            label: "Background Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Use a html color name, HEX, RGB or RGBA value",
            placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
            propertyName: "borderColor",
            label: "Border Color",
            controlType: "COLOR_PICKER",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Enter value for border width",
            propertyName: "borderWidth",
            label: "Border Width",
            placeholderText: "Enter value in px",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
          {
            propertyName: "borderRadius",
            label: "Border Radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",

            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "boxShadow",
            label: "Box Shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  onTabChange = (tabWidgetId: string) => {
    this.props.updateWidgetMetaProperty("selectedTabWidgetId", tabWidgetId, {
      triggerPropertyName: "onTabSelected",
      dynamicString: this.props.onTabSelected,
      event: {
        type: EventType.ON_TAB_CHANGE,
      },
    });
  };

  static getDerivedPropertiesMap() {
    return {
      selectedTab: `{{(()=>{${derivedProperties.getSelectedTab}})()}}`,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedTabWidgetId: undefined,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  getPageView() {
    const { leftColumn, parentColumnSpace, rightColumn } = this.props;

    const tabsComponentProps = {
      ...this.props,
      tabs: this.getVisibleTabs(),
      width:
        (rightColumn - leftColumn) * parentColumnSpace - WIDGET_PADDING * 2,
    };
    return (
      <TabsComponent
        {...tabsComponentProps}
        backgroundColor={this.props.backgroundColor}
        borderColor={this.props.borderColor}
        borderRadius={this.props.borderRadius}
        borderWidth={this.props.borderWidth}
        boxShadow={this.props.boxShadow}
        onTabChange={this.onTabChange}
        primaryColor={this.props.primaryColor}
      >
        {this.renderComponent()}
      </TabsComponent>
    );
  }

  renderComponent = () => {
    const selectedTabWidgetId = this.props.selectedTabWidgetId;
    const childWidgetData = {
      ...this.props.children?.filter(Boolean).filter((item) => {
        return selectedTabWidgetId === item.widgetId;
      })[0],
    };
    if (!childWidgetData) {
      return null;
    }

    childWidgetData.shouldScrollContents = false;
    childWidgetData.canExtend = this.props.shouldScrollContents;
    const { componentHeight, componentWidth } = this.getComponentDimensions();
    childWidgetData.rightColumn = componentWidth;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.bottomRow = this.props.shouldScrollContents
      ? childWidgetData.bottomRow
      : componentHeight - 1;
    childWidgetData.parentId = this.props.widgetId;
    childWidgetData.minHeight = componentHeight;

    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  };

  static getWidgetType(): string {
    return "TABS_WIDGET";
  }

  componentDidUpdate(prevProps: TabsWidgetProps<TabContainerWidgetProps>) {
    const visibleTabs = this.getVisibleTabs();
    const selectedTab = find(visibleTabs, {
      widgetId: this.props.selectedTabWidgetId,
    });

    if (this.props.defaultTab !== prevProps.defaultTab || !selectedTab) {
      this.setDefaultSelectedTabWidgetId();
    }
  }

  getVisibleTabs = () => {
    const tabs = Object.values(this.props.tabsObj || {});
    if (tabs.length) {
      return tabs
        .filter(
          (tab) => tab.isVisible === undefined || !!tab.isVisible === true,
        )
        .sort((tab1, tab2) => tab1.index - tab2.index);
    }
    return [];
  };

  setDefaultSelectedTabWidgetId = () => {
    const visibleTabs = this.getVisibleTabs();
    // Find the default Tab object
    const defaultTab = find(visibleTabs, {
      label: this.props.defaultTab,
    });
    // Find the default Tab id
    const defaultTabWidgetId =
      defaultTab?.widgetId ?? visibleTabs?.[0]?.widgetId; // in case the default tab is deleted

    // If we have a legitimate default tab Id and it is not already the selected Tab
    if (
      defaultTabWidgetId &&
      defaultTabWidgetId !== this.props.selectedTabWidgetId
    ) {
      // Select the default tab
      this.props.updateWidgetMetaProperty(
        "selectedTabWidgetId",
        defaultTabWidgetId,
      );
    }
  };

  componentDidMount() {
    Object.keys(this.props.tabsObj || {}).length &&
      this.setDefaultSelectedTabWidgetId();
  }
}

export default TabsWidget;
