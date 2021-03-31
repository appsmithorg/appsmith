import React from "react";
import TabsComponent from "components/designSystems/appsmith/TabsComponent";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import WidgetFactory from "utils/WidgetFactory";
import { WidgetPropertyValidationType } from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import _ from "lodash";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { WidgetOperations } from "widgets/BaseWidget";
import * as Sentry from "@sentry/react";
import { generateReactKey } from "utils/generators";
import withMeta, { WithMeta } from "./MetaHOC";

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
            helpText: "Takes an array of tab names to render tabs",
            propertyName: "tabs",
            isJSConvertible: true,
            label: "Tabs",
            controlType: "TABS_INPUT",
            isBindProperty: true,
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
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      tabs: VALIDATION_TYPES.TABS_DATA,
      defaultTab: VALIDATION_TYPES.SELECTED_TAB,
    };
  }

  onTabChange = (tabWidgetId: string) => {
    this.props.updateWidgetMetaProperty("selectedTabWidgetId", tabWidgetId, {
      dynamicString: this.props.onTabSelected,
      event: {
        type: EventType.ON_TAB_CHANGE,
      },
    });
  };

  static getDerivedPropertiesMap() {
    return {
      selectedTab: `{{_.find(this.tabs, { widgetId: this.selectedTabWidgetId }).label}}`,
    };
  }

  static getMetaPropertiesMap() {
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
    childWidgetData.shouldScrollContents = false;
    childWidgetData.canExtend = this.props.shouldScrollContents;
    const { componentWidth, componentHeight } = this.getComponentDimensions();
    childWidgetData.rightColumn = componentWidth;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.bottomRow = this.props.shouldScrollContents
      ? childWidgetData.bottomRow
      : componentHeight - 1;
    childWidgetData.parentId = this.props.widgetId;
    childWidgetData.minHeight = componentHeight;

    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  };

  getWidgetType(): WidgetType {
    return "TABS_WIDGET";
  }

  addTabContainer = (widgetIds: string[]) => {
    widgetIds.forEach((newWidgetId: string) => {
      const tab = this.props.tabs.find((tab) => tab.widgetId === newWidgetId);
      if (tab) {
        const columns =
          (this.props.rightColumn - this.props.leftColumn) *
          this.props.parentColumnSpace;
        const rows =
          (this.props.bottomRow - this.props.topRow - 1) *
          this.props.parentRowSpace;
        const config = {
          type: WidgetTypes.CANVAS_WIDGET,
          columns: columns,
          rows: rows,
          topRow: 1,
          newWidgetId,
          widgetId: this.props.widgetId,
          props: {
            tabId: tab.id,
            tabName: tab.label,
            containerStyle: "none",
            canExtend: false,
            detachFromLayout: true,
            children: [],
          },
        };
        this.updateWidget(
          WidgetOperations.ADD_CHILD,
          this.props.widgetId,
          config,
        );
      }
    });
  };

  removeTabContainer = (widgetIds: string[]) => {
    widgetIds.forEach((widgetIdToRemove: string) => {
      this.updateWidget(WidgetOperations.DELETE, widgetIdToRemove, {
        parentId: this.props.widgetId,
      });
    });
  };

  componentDidUpdate(prevProps: TabsWidgetProps<TabContainerWidgetProps>) {
    if (
      Array.isArray(this.props.tabs) &&
      JSON.stringify(this.props.tabs) !== JSON.stringify(prevProps.tabs)
    ) {
      const tabWidgetIds = this.props.tabs.map((tab) => tab.widgetId);
      const childWidgetIds = this.props.children
        .filter(Boolean)
        .map((child) => child.widgetId);
      // If the tabs and children are different,
      // add and/or remove tab container widgets

      if (!this.props.invalidProps?.tabs) {
        if (_.xor(childWidgetIds, tabWidgetIds).length > 0) {
          const widgetIdsToRemove: string[] = _.without(
            childWidgetIds,
            ...tabWidgetIds,
          );
          const widgetIdsToCreate: string[] = _.without(
            tabWidgetIds,
            ...childWidgetIds,
          );
          this.addTabContainer(widgetIdsToCreate);
          this.removeTabContainer(widgetIdsToRemove);
        }

        // If all tabs were removed.
        if (tabWidgetIds.length === 0) {
          const newTabContainerWidgetId = generateReactKey();
          const tabs = [
            { id: "tab1", widgetId: newTabContainerWidgetId, label: "Tab 1" },
          ];
          this.updateWidgetProperty("tabs", tabs);
        }
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
    const { tabs, widgetId } = this.props;
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
      type: WidgetTypes.CANVAS_WIDGET,
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
    this.updateWidget(WidgetOperations.ADD_CHILDREN, widgetId, {
      children: tabContainers,
    });
  };

  getVisibleTabs = () => {
    if (Array.isArray(this.props.tabs)) {
      return this.props.tabs.filter(
        (tab) => tab.isVisible === undefined || tab.isVisible === true,
      );
    }
    return [];
  };

  componentDidMount() {
    const visibleTabs = this.getVisibleTabs();
    // If we have a defaultTab
    if (this.props.defaultTab && this.props.tabs?.length) {
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
    } else if (!this.props.selectedTabWidgetId && this.props.tabs?.length) {
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

export interface TabContainerWidgetProps extends WidgetProps {
  tabId: string;
}

export interface TabsWidgetProps<T extends TabContainerWidgetProps>
  extends WidgetProps,
    WithMeta {
  isVisible?: boolean;
  shouldScrollContents: boolean;
  tabs: Array<{
    id: string;
    label: string;
    widgetId: string;
    isVisible?: boolean;
  }>;
  shouldShowTabs: boolean;
  children: T[];
  snapColumns?: number;
  onTabSelected?: string;
  snapRows?: number;
  defaultTab: string;
  selectedTabWidgetId: string;
}

export default TabsWidget;
export const ProfiledTabsWidget = Sentry.withProfiler(withMeta(TabsWidget));
