import React from "react";
import TabsComponent from "components/designSystems/appsmith/TabsComponent";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import WidgetFactory, { TriggerPropertiesMap } from "utils/WidgetFactory";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import _ from "lodash";
import { EventType } from "constants/ActionConstants";
import { WidgetOperations } from "widgets/BaseWidget";
import * as Sentry from "@sentry/react";
import { generateReactKey } from "utils/generators";
import withMeta, { WithMeta } from "./MetaHOC";

class TabsWidget extends BaseWidget<
  TabsWidgetProps<TabContainerWidgetProps>,
  WidgetState
> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      tabs: VALIDATION_TYPES.TABS_DATA,
      defaultTab: VALIDATION_TYPES.SELECTED_TAB,
    };
  }

  onTabChange = (tabId: string) => {
    this.props.updateWidgetMetaProperty("selectedTabId", tabId, {
      dynamicString: this.props.onTabSelected,
      event: {
        type: EventType.ON_TAB_CHANGE,
      },
    });
  };

  static getDerivedPropertiesMap() {
    return {
      selectedTab: `{{_.find(this.tabs, { id: this.selectedTabId }).label}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedTab: "defaultTab",
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onTabSelected: true,
    };
  }

  getPageView() {
    return (
      <TabsComponent {...this.props} onTabChange={this.onTabChange}>
        {this.renderComponent()}
      </TabsComponent>
    );
  }

  renderComponent = () => {
    const selectedTabId = this.props.selectedTabId;

    const childWidgetData: TabContainerWidgetProps = this.props.children
      ?.filter(Boolean)
      .filter(item => {
        return selectedTabId === item.tabId;
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
      const tab = this.props.tabs.find(tab => tab.widgetId === newWidgetId);
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
      this.props.tabs.length !== prevProps.tabs.length &&
      this.props.children.length !== this.props.tabs.length
    ) {
      const tabWidgetIds = this.props.tabs.map(tab => tab.widgetId);
      const childWidgetIds = this.props.children
        .filter(Boolean)
        .map(child => child.widgetId);
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
          this.updateWidgetProperty("tabs", JSON.stringify(tabs));
        }
      }
    }
    if (this.props.defaultTab) {
      if (this.props.defaultTab !== prevProps.defaultTab) {
        const selectedTab = _.find(this.props.tabs, {
          label: this.props.defaultTab,
        });
        const selectedTabId = selectedTab ? selectedTab.id : undefined;
        this.props.updateWidgetMetaProperty("selectedTabId", selectedTabId);
      }
    }
  }

  generateTabContainers = () => {
    const { tabs, widgetId } = this.props;
    const childWidgetIds = this.props.children
      ?.filter(Boolean)
      .map(child => child.widgetId);
    let tabsToCreate = tabs;
    if (childWidgetIds && childWidgetIds.length > 0) {
      tabsToCreate = tabs.filter(
        tab => childWidgetIds.indexOf(tab.widgetId) === -1,
      );
    }

    const tabContainers = tabsToCreate.map(tab => ({
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

  componentDidMount() {
    // If we have a defaultTab
    if (this.props.defaultTab) {
      // Find the default Tab object
      const selectedTab = _.find(this.props.tabs, {
        label: this.props.defaultTab,
      });
      // Find the default Tab id
      const selectedTabId = selectedTab?.id;
      // If we have a legitimate default tab Id and it is not already the selected Tab
      if (selectedTabId && selectedTabId !== this.props.selectedTabId) {
        // Select the default tab
        this.props.updateWidgetMetaProperty("selectedTabId", selectedTabId);
      }
    } else if (!this.props.selectedTabId) {
      // If no tab is selected
      // Select the first tab in the tabs list.
      this.props.updateWidgetMetaProperty(
        "selectedTabId",
        this.props.tabs[0].id,
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
  }>;
  shouldShowTabs: boolean;
  children: T[];
  snapColumns?: number;
  onTabSelected?: string;
  snapRows?: number;
  defaultTab: string;
  selectedTabId: string;
}

export default TabsWidget;
export const ProfiledTabsWidget = Sentry.withProfiler(withMeta(TabsWidget));
