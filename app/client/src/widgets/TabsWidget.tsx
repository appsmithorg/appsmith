import React from "react";
import TabsComponent from "components/designSystems/appsmith/TabsComponent";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import WidgetFactory, { TriggerPropertiesMap } from "utils/WidgetFactory";
import { generateReactKey } from "utils/generators";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import _ from "lodash";
import { EventType } from "constants/ActionConstants";

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
    this.updateWidgetMetaProperty("selectedTabId", tabId);
    if (this.props.onTabSelected) {
      super.executeAction({
        dynamicString: this.props.onTabSelected,
        event: {
          type: EventType.ON_TAB_CHANGE,
        },
      });
    }
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
    const childWidgetData: TabContainerWidgetProps = this.props.children.filter(
      item => {
        return selectedTabId === item.tabId;
      },
    )[0];

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

  addTabContainer = () => {
    let tabId = "";
    const childrenTabIds: string[] = this.props.children.map(children => {
      return children.tabId;
    });
    for (let index = 0; index < this.props.tabs.length; index++) {
      const tab = this.props.tabs[index];
      if (!childrenTabIds.includes(tab.id)) {
        tabId = tab.id;
      }
    }
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
      parentRowSpace: 1,
      parentColumnSpace: 1,
      leftColumn: 0,
      topRow: 1,
      newWidgetId: generateReactKey(),
      widgetId: this.props.widgetId,
      props: {
        tabId: tabId,
        containerStyle: "none",
        canExtend: false,
        detachFromLayout: true,
        children: [],
      },
    };
    this.updateWidget("ADD_CHILD", this.props.widgetId, config);
  };

  removeTabContainer = () => {
    let removedContainerWidgetId = "";
    const tabIds: string[] = this.props.tabs.map(tab => {
      return tab.id;
    });
    for (let index = 0; index < this.props.children.length; index++) {
      const children = this.props.children[index];
      if (!tabIds.includes(children.tabId)) {
        removedContainerWidgetId = children.widgetId;
      }
    }
    this.updateWidget("REMOVE_CHILD", removedContainerWidgetId, {
      parentId: this.props.widgetId,
    });
  };

  componentDidUpdate(prevProps: TabsWidgetProps<TabContainerWidgetProps>) {
    super.componentDidUpdate(prevProps);
    if (this.props.tabs) {
      if (
        this.props.tabs.length !== prevProps.tabs.length &&
        this.props.children.length !== this.props.tabs.length
      ) {
        //adding container widget for the new tab
        if (this.props.tabs.length > this.props.children.length) {
          this.addTabContainer();
        }
        //removing container widget for the removed tab
        else {
          this.removeTabContainer();
        }
      }
    }
    if (this.props.defaultTab) {
      if (this.props.defaultTab !== prevProps.defaultTab) {
        const selectedTab = _.find(this.props.tabs, {
          label: this.props.defaultTab,
        });
        const selectedTabId = selectedTab ? selectedTab.id : undefined;
        this.updateWidgetMetaProperty("selectedTabId", selectedTabId);
      }
    }
  }

  componentDidMount() {
    if (this.props.defaultTab) {
      const selectedTab = _.find(this.props.tabs, {
        label: this.props.defaultTab,
      });
      const selectedTabId = selectedTab ? selectedTab.id : undefined;
      this.updateWidgetMetaProperty("selectedTabId", selectedTabId);
    }
  }
}

export interface TabContainerWidgetProps extends WidgetProps {
  tabId: string;
}

export interface TabsWidgetProps<T extends TabContainerWidgetProps>
  extends WidgetProps {
  isVisible?: boolean;
  shouldScrollContents: boolean;
  tabs: Array<{
    id: string;
    label: string;
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
