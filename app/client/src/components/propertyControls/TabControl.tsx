import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledPropertyPaneButton } from "./StyledControls";
import styled from "constants/DefaultTheme";
import {
  BaseItemProps,
  DroppableComponent,
  RenderComponentProps,
} from "components/ads/DraggableListComponent";
import orderBy from "lodash/orderBy";
import isString from "lodash/isString";
import isUndefined from "lodash/isUndefined";
import includes from "lodash/includes";
import map from "lodash/map";
import * as Sentry from "@sentry/react";
import { Category, Size } from "components/ads/Button";
import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { DraggableListCard } from "components/ads/DraggableListCard";

const StyledPropertyPaneButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
  margin-top: 10px;
`;

const TabsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

type DroppableItem = BaseItemProps;

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
    <StyledPropertyPaneButtonWrapper>
      <StyledPropertyPaneButton
        category={Category.tertiary}
        className="t--add-tab-btn"
        icon="plus"
        onClick={addOption}
        size={Size.medium}
        tag="button"
        text="Add a Tab"
        type="button"
      />
    </StyledPropertyPaneButtonWrapper>
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
      placeholder="Tab Title"
    />
  );
}

type State = {
  focusedIndex: number | null;
  duplicateTabIds: string[];
};

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

  updateItems = (items: Array<Record<string, any>>) => {
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
    return (
      <TabsWrapper>
        <DroppableComponent
          deleteOption={this.deleteOption}
          fixedHeight={370}
          focusedIndex={this.state.focusedIndex}
          itemHeight={45}
          items={this.getTabItems()}
          onEdit={this.onEdit}
          renderComponent={TabControlComponent}
          toggleVisibility={this.toggleVisibility}
          updateFocus={this.updateFocus}
          updateItems={this.updateItems}
          updateOption={this.updateOption}
        />
        <AddTabButtonComponent
          widgetId={this.props.widgetProperties.widgetId}
        />
      </TabsWrapper>
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
