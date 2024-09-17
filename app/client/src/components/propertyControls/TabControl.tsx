import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type {
  BaseItemProps as DroppableItem,
  RenderComponentProps,
} from "./DraggableListComponent";
import orderBy from "lodash/orderBy";
import isString from "lodash/isString";
import isUndefined from "lodash/isUndefined";
import includes from "lodash/includes";
import map from "lodash/map";
import * as Sentry from "@sentry/react";
import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { DraggableListControl } from "pages/Editor/PropertyPane/DraggableListControl";
import { DraggableListCard } from "components/propertyControls/DraggableListCard";
import { Button, Tag } from "@appsmith/ads";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AddTabButtonComponent({ widgetId }: any) {
  const dispatch = useDispatch();
  const addOption = () => {
    dispatch({
      type: ReduxActionTypes.WIDGET_ADD_NEW_TAB_CHILD,
      payload: {
        widgetId,
      },
    });
  };
  return (
    <Button
      className="self-end t--add-tab-btn"
      kind="tertiary"
      onClick={addOption}
      size="sm"
      startIcon="plus"
    >
      Add tab
    </Button>
  );
}

function TabControlComponent(props: RenderComponentProps<DroppableItem>) {
  const { index, item } = props;
  const dispatch = useDispatch();
  const deleteOption = () => {
    dispatch({
      type: ReduxActionTypes.WIDGET_DELETE_TAB_CHILD,
      payload: { ...item, index },
    });
    if (props.deleteOption) props.deleteOption(index);
  };

  return (
    <DraggableListCard
      {...props}
      deleteOption={deleteOption}
      isDelete
      placeholder="Tab title"
    />
  );
}

interface State {
  focusedIndex: number | null;
  duplicateTabIds: string[];
}

class TabControl extends BaseControl<ControlProps, State> {
  constructor(props: ControlProps) {
    super(props);

    this.state = {
      focusedIndex: null,
      duplicateTabIds: this.getDuplicateTabIds(props.propertyValue),
    };
  }

  getDuplicateTabIds = (propertyValue: ControlProps["propertyValue"]) => {
    const duplicateTabIds = [];
    const tabIds = Object.keys(propertyValue);
    const tabNames = map(propertyValue, "label");

    for (let index = 0; index < tabNames.length; index++) {
      const currLabel = tabNames[index] as string;
      const duplicateValueIndex = tabNames.indexOf(currLabel);
      if (duplicateValueIndex !== index) {
        // get tab id from propertyValue index
        duplicateTabIds.push(propertyValue[tabIds[index]].id);
      }
    }

    return duplicateTabIds;
  };

  componentDidMount() {
    this.migrateTabData(this.props.propertyValue);
  }

  componentDidUpdate(prevProps: ControlProps): void {
    //on adding a new column last column should get focused
    if (
      Object.keys(prevProps.propertyValue).length + 1 ===
      Object.keys(this.props.propertyValue).length
    ) {
      this.updateFocus(Object.keys(this.props.propertyValue).length - 1, true);
    }
  }

  migrateTabData(
    tabData: Array<{
      id: string;
      label: string;
    }>,
  ) {
    // Added a migration script for older tab data that was strings
    // deprecate after enough tabs have moved to the new format
    if (isString(tabData)) {
      try {
        const parsedData: Array<{
          sid: string;
          label: string;
        }> = JSON.parse(tabData);
        this.updateProperty(this.props.propertyName, parsedData);
        return parsedData;
      } catch (error) {
        Sentry.captureException({
          message: "Tab Migration Failed",
          oldData: this.props.propertyValue,
        });
      }
    } else {
      return this.props.propertyValue;
    }
  }

  getTabItems = () => {
    let menuItems: Array<{
      id: string;
      label: string;
      isVisible?: boolean;
      isDuplicateLabel?: boolean;
    }> =
      isString(this.props.propertyValue) ||
      isUndefined(this.props.propertyValue)
        ? []
        : Object.values(this.props.propertyValue);
    menuItems = orderBy(menuItems, ["index"], ["asc"]);
    menuItems = menuItems.map((tab: DroppableItem) => ({
      ...tab,
      isDuplicateLabel: includes(this.state.duplicateTabIds, tab.id),
    }));
    return menuItems;
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateItems = (items: Array<Record<string, any>>) => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tabsObj = items.reduce((obj: any, each: any, index: number) => {
      obj[each.id] = {
        ...each,
        index,
      };
      return obj;
    }, {});
    this.updateProperty(this.props.propertyName, tabsObj);
  };

  onEdit = (index: number) => {
    const tabs = this.getTabItems();
    const tabToChange = tabs[index];
    this.props.openNextPanel({
      index,
      ...tabToChange,
      propPaneId: this.props.widgetProperties.widgetId,
    });
  };
  render() {
    const tabs = this.getTabItems();
    return (
      <div className="flex flex-col">
        <div className="t--number-of-tabs mb-1 ml-auto">
          <Tag isClosable={false}>{tabs.length}</Tag>
        </div>
        <DraggableListControl
          deleteOption={this.deleteOption}
          fixedHeight={370}
          focusedIndex={this.state.focusedIndex}
          itemHeight={45}
          items={tabs}
          onEdit={this.onEdit}
          propertyPath={this.props.dataTreePath}
          renderComponent={TabControlComponent}
          toggleVisibility={this.toggleVisibility}
          updateFocus={this.updateFocus}
          updateItems={this.updateItems}
          updateOption={this.updateOption}
        />
        <AddTabButtonComponent
          widgetId={this.props.widgetProperties.widgetId}
        />
      </div>
    );
  }

  toggleVisibility = (index: number) => {
    const tabs = this.getTabItems();
    const isVisible = tabs[index].isVisible === true ? false : true;
    const updatedTabs = tabs.map((tab, tabIndex) => {
      if (index === tabIndex) {
        return {
          ...tab,
          isVisible: isVisible,
        };
      }
      return tab;
    });
    this.updateProperty(this.props.propertyName, updatedTabs);
  };

  deleteOption = (index: number) => {
    const tabIds = Object.keys(this.props.propertyValue);
    const newPropertyValue = { ...this.props.propertyValue };
    // detele current item from propertyValue
    delete newPropertyValue[tabIds[index]];
    const duplicateTabIds = this.getDuplicateTabIds(newPropertyValue);
    this.setState({ duplicateTabIds });
  };

  updateOption = (index: number, updatedLabel: string) => {
    const tabsArray = this.getTabItems();
    const { id: itemId } = tabsArray[index];
    this.updateProperty(
      `${this.props.propertyName}.${itemId}.label`,
      updatedLabel,
    );
    // check entered label is unique or duplicate
    const tabNames = map(tabsArray, "label");
    let duplicateTabIds = [...this.state.duplicateTabIds];
    // if duplicate, add into array
    if (includes(tabNames, updatedLabel)) {
      duplicateTabIds.push(itemId);
      this.setState({ duplicateTabIds });
    } else {
      duplicateTabIds = duplicateTabIds.filter((id) => id !== itemId);
      this.setState({ duplicateTabIds });
    }
  };

  updateFocus = (index: number, isFocused: boolean) => {
    this.setState({ focusedIndex: isFocused ? index : null });
  };

  static getControlType() {
    return "TABS_INPUT";
  }
}

export default TabControl;
