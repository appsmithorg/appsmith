import React from "react";
import TabsComponent from "../component";
import BaseWidget, { WidgetState } from "../../BaseWidget";
import WidgetFactory from "utils/WidgetFactory";
import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import _ from "lodash";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { WidgetOperations } from "widgets/BaseWidget";
import { generateReactKey } from "widgets/WidgetUtils";
import { TabContainerWidgetProps, TabsWidgetProps } from "../constants";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

import { AutocompleteDataType } from "utils/autocomplete/TernServer";

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
    isValid: tabNames.includes(value as string),
    parsed: value,
    message: `Tab name ${value} does not exist`,
  };
}
class TabsWidget extends BaseWidget<
  TabsWidgetProps<TabContainerWidgetProps>,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "tabsObj",
            isJSConvertible: false,
            label: "Tabs",
            controlType: "TABS_INPUT",
            isBindProperty: false,
            isTriggerProperty: false,
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
                  sectionName: "Tab Control",
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
            placeholderText: "Enter tab name",
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
            },
            dependencies: ["tabsObj", "tabs"],
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
            validation: { type: ValidationTypes.BOOLEAN },
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
      selectedTab: `{{_.find(Object.values(this.tabsObj), {
        widgetId: this.selectedTabWidgetId,
      }).label}}`,
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
    const tabsComponentProps = {
      ...this.props,
      tabs: this.getVisibleTabs(),
    };
    return (
      <TabsComponent {...tabsComponentProps} onTabChange={this.onTabChange}>
        {this.renderComponent()}
      </TabsComponent>
    );
  }

  renderComponent = () => {
    const selectedTabWidgetId = this.props.selectedTabWidgetId;
    const childWidgetData: TabContainerWidgetProps = this.props.children
      ?.filter(Boolean)
      .filter((item) => {
        return selectedTabWidgetId === item.widgetId;
      })[0];
    if (!childWidgetData) {
      return null;
    }

    return WidgetFactory.createWidget(childWidgetData);
  };

  static getWidgetType(): string {
    return "TABS_WIDGET";
  }

  addTabContainer = (widgetIds: string[]) => {
    const tabs = Object.values(this.props.tabsObj || {});
    widgetIds.forEach((newWidgetId: string) => {
      const tab = _.find(tabs, {
        widgetId: newWidgetId,
      });
      if (tab) {
        const columns =
          (this.props.rightColumn - this.props.leftColumn) *
          this.props.parentColumnSpace;
        // GRID_DENSITY_MIGRATION_V1 used to adjust code as per new scaled canvas.
        const rows =
          (this.props.bottomRow -
            this.props.topRow -
            GRID_DENSITY_MIGRATION_V1) *
          this.props.parentRowSpace;
        const config = {
          // Todo(abhinav): abstraction leaks
          type: "CANVAS_WIDGET",
          columns: columns,
          rows: rows,
          topRow: 1,
          newWidgetId,
          widgetId: this.props.widgetId,
          leftColumn: 0,
          rightColumn:
            (this.props.rightColumn - this.props.leftColumn) *
            this.props.parentColumnSpace,
          bottomRow:
            (this.props.bottomRow - this.props.topRow) *
            this.props.parentRowSpace,
          props: {
            tabId: tab.id,
            tabName: tab.label,
            containerStyle: "none",
            canExtend: false,
            detachFromLayout: true,
            children: [],
          },
        };
        super.updateWidget(
          WidgetOperations.ADD_CHILD,
          this.props.widgetId,
          config,
        );
      }
    });
  };

  updateTabContainerNames = () => {
    this.props.children.forEach((each) => {
      const tab = this.props.tabsObj[each.tabId];
      if (tab && each.tabName !== tab.label) {
        super.updateWidget(WidgetOperations.UPDATE_PROPERTY, each.widgetId, {
          propertyPath: "tabName",
          propertyValue: tab.label,
        });
      }
    });
  };

  removeTabContainer = (widgetIds: string[]) => {
    widgetIds.forEach((widgetIdToRemove: string) => {
      super.updateWidget(WidgetOperations.DELETE, widgetIdToRemove, {
        parentId: this.props.widgetId,
      });
    });
  };

  componentDidUpdate(prevProps: TabsWidgetProps<TabContainerWidgetProps>) {
    if (
      JSON.stringify(this.props.tabsObj) !== JSON.stringify(prevProps.tabsObj)
    ) {
      const tabWidgetIds = Object.values(this.props.tabsObj).map(
        (tab) => tab.widgetId,
      );
      const childWidgetIds = this.props.children
        .filter(Boolean)
        .map((child) => child.widgetId);
      // If the tabs and children are different,
      // add and/or remove tab container widgets
      if (_.xor(childWidgetIds, tabWidgetIds).length > 0) {
        const widgetIdsToRemove: string[] = _.without(
          childWidgetIds,
          ...tabWidgetIds,
        );
        const widgetIdsToCreate: string[] = _.without(
          tabWidgetIds,
          ...childWidgetIds,
        );
        if (widgetIdsToCreate && widgetIdsToCreate.length) {
          this.addTabContainer(widgetIdsToCreate);
        }
        if (widgetIdsToRemove && widgetIdsToRemove.length) {
          this.removeTabContainer(widgetIdsToRemove);
        }
      }
      this.updateTabContainerNames();
      // If all tabs were removed.
      if (tabWidgetIds.length === 0) {
        const newTabContainerWidgetId = generateReactKey();
        const tabs = {
          tab1: {
            id: "tab1",
            widgetId: newTabContainerWidgetId,
            label: "Tab 1",
            index: 0,
          },
        };
        super.updateWidgetProperty("tabsObj", tabs);
      }
    }
    const visibleTabs = this.getVisibleTabs();
    if (this.props.defaultTab) {
      if (this.props.defaultTab !== prevProps.defaultTab) {
        const selectedTab = _.find(visibleTabs, {
          label: this.props.defaultTab,
        });
        const selectedTabWidgetId = selectedTab
          ? selectedTab.widgetId
          : undefined;
        this.props.updateWidgetMetaProperty(
          "selectedTabWidgetId",
          selectedTabWidgetId,
        );
      }
    }
    // if selected tab is deleted
    if (this.props.selectedTabWidgetId) {
      if (visibleTabs.length > 0) {
        const selectedTabWithinTabs = _.find(visibleTabs, {
          widgetId: this.props.selectedTabWidgetId,
        });
        if (!selectedTabWithinTabs) {
          // try to select default else select first
          const defaultTab = _.find(visibleTabs, {
            label: this.props.defaultTab,
          });
          this.props.updateWidgetMetaProperty(
            "selectedTabWidgetId",
            (defaultTab && defaultTab.widgetId) || visibleTabs[0].widgetId,
          );
        }
      } else {
        this.props.updateWidgetMetaProperty("selectedTabWidgetId", undefined);
      }
    } else if (!this.props.selectedTabWidgetId) {
      if (visibleTabs.length > 0) {
        this.props.updateWidgetMetaProperty(
          "selectedTabWidgetId",
          visibleTabs[0].widgetId,
        );
      }
    }
  }

  generateTabContainers = () => {
    const { tabsObj, widgetId } = this.props;
    const tabs = Object.values(tabsObj || {});
    const childWidgetIds = this.props.children
      ?.filter(Boolean)
      .map((child) => child.widgetId);
    let tabsToCreate = tabs || [];
    if (childWidgetIds && childWidgetIds.length > 0 && Array.isArray(tabs)) {
      tabsToCreate = tabs.filter(
        (tab) => childWidgetIds.indexOf(tab.widgetId) === -1,
      );
    }

    const tabContainers = tabsToCreate.map((tab) => ({
      type: "CANVAS_WIDGET",
      tabId: tab.id,
      tabName: tab.label,
      widgetId: tab.widgetId,
      parentId: widgetId,
      detachFromLayout: true,
      children: [],
      parentRowSpace: 1,
      parentColumnSpace: 1,
      leftColumn: 0,
      rightColumn:
        (this.props.rightColumn - this.props.leftColumn) *
        this.props.parentColumnSpace,
      topRow: 0,
      bottomRow:
        (this.props.bottomRow - this.props.topRow) * this.props.parentRowSpace,
      isLoading: false,
    }));
    if (tabContainers && tabContainers.length > 0) {
      super.updateWidget(WidgetOperations.ADD_CHILDREN, widgetId, {
        children: tabContainers,
      });
    }
  };

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

  componentDidMount() {
    const visibleTabs = this.getVisibleTabs();
    // If we have a defaultTab
    if (this.props.defaultTab && Object.keys(this.props.tabsObj || {}).length) {
      // Find the default Tab object
      const selectedTab = _.find(visibleTabs, {
        label: this.props.defaultTab,
      });
      // Find the default Tab id
      const selectedTabWidgetId = selectedTab
        ? selectedTab.widgetId
        : visibleTabs.length
        ? visibleTabs[0].widgetId
        : undefined; // in case the default tab is deleted
      // If we have a legitimate default tab Id and it is not already the selected Tab
      if (
        selectedTabWidgetId &&
        selectedTabWidgetId !== this.props.selectedTabWidgetId
      ) {
        // Select the default tab
        this.props.updateWidgetMetaProperty(
          "selectedTabWidgetId",
          selectedTabWidgetId,
        );
      }
    } else if (
      !this.props.selectedTabWidgetId &&
      Object.keys(this.props.tabsObj || {}).length
    ) {
      // If no tab is selected
      // Select the first tab in the tabs list.
      this.props.updateWidgetMetaProperty(
        "selectedTabWidgetId",
        visibleTabs.length ? visibleTabs[0].widgetId : undefined,
      );
    }
    this.generateTabContainers();
  }
}

export default TabsWidget;
