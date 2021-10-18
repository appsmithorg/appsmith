import React, { useCallback, useEffect, useState } from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  StyledInputGroup,
  StyledPropertyPaneButton,
  StyledDragIcon,
  StyledDeleteIcon,
  StyledEditIcon,
} from "./StyledControls";
import styled from "constants/DefaultTheme";
import { generateReactKey } from "utils/generators";
import { DroppableComponent } from "components/ads/DraggableListComponent";
import { getNextEntityName, noop } from "utils/AppsmithUtils";
import _, { debounce, orderBy } from "lodash";
import * as Sentry from "@sentry/react";
import { Category, Size } from "components/ads/Button";
import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

const StyledPropertyPaneButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
  margin-top: 10px;
`;

const ItemWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const TabsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const StyledOptionControlInputGroup = styled(StyledInputGroup)`
  margin-right: 2px;
  margin-bottom: 2px;
  width: 100%;
  padding-left: 10px;
  background: inherit;
  &&& {
    input {
      border: none;
      color: ${(props) => props.theme.colors.propertyPane.radioGroupText};
      background: ${(props) => props.theme.colors.propertyPane.radioGroupBg};
      &:focus {
        border: none;
        color: ${(props) => props.theme.colors.textOnDarkBG};
        background: ${(props) => props.theme.colors.paneInputBG};
      }
    }
  }
`;

type RenderComponentProps = {
  index: number;
  item: {
    label: string;
    isVisible?: boolean;
  };
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
  toggleVisibility?: (index: number) => void;
  onEdit?: (props: any) => void;
};

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

function TabControlComponent(props: RenderComponentProps) {
  const { index, item, updateOption } = props;
  const dispatch = useDispatch();
  const deleteOption = () => {
    dispatch({
      type: ReduxActionTypes.WIDGET_DELETE_TAB_CHILD,
      payload: { ...item, index },
    });
  };

  const [value, setValue] = useState(item.label);
  const [isEditing, setEditing] = useState(false);

  useEffect(() => {
    if (!isEditing && item && item.label) setValue(item.label);
  }, [item?.label, isEditing]);

  const debouncedUpdate = debounce(updateOption, 1000);
  const handleChange = useCallback(() => props.onEdit && props.onEdit(index), [
    index,
  ]);

  const onChange = useCallback(
    (index: number, value: string) => {
      setValue(value);
      debouncedUpdate(index, value);
    },
    [updateOption],
  );

  const onFocus = () => setEditing(true);
  const onBlur = () => setEditing(false);

  return (
    <ItemWrapper>
      <StyledDragIcon height={20} width={20} />
      <StyledOptionControlInputGroup
        dataType="text"
        onBlur={onBlur}
        onChange={(value: string) => {
          onChange(index, value);
        }}
        onFocus={onFocus}
        placeholder="Tab Title"
        value={value}
      />
      <StyledDeleteIcon
        className="t--delete-tab-btn"
        height={20}
        marginRight={12}
        onClick={deleteOption}
        width={20}
      />
      <StyledEditIcon
        className="t--edit-column-btn"
        height={20}
        onClick={handleChange}
        width={20}
      />
    </ItemWrapper>
  );
}

class TabControl extends BaseControl<ControlProps> {
  componentDidMount() {
    this.migrateTabData(this.props.propertyValue);
  }

  migrateTabData(
    tabData: Array<{
      id: string;
      label: string;
    }>,
  ) {
    // Added a migration script for older tab data that was strings
    // deprecate after enough tabs have moved to the new format
    if (_.isString(tabData)) {
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
    const tabs: Array<{
      id: string;
      label: string;
    }> = Object.values(this.props.propertyValue);
    const tabToChange = tabs[index];
    this.props.openNextPanel({
      index,
      ...tabToChange,
      propPaneId: this.props.widgetProperties.widgetId,
    });
  };
  render() {
    const tabs: Array<{
      id: string;
      label: string;
    }> = _.isString(this.props.propertyValue)
      ? []
      : Object.values(this.props.propertyValue);

    return (
      <TabsWrapper>
        <DroppableComponent
          deleteOption={noop}
          itemHeight={45}
          items={orderBy(tabs, ["index"], ["asc"])}
          onEdit={this.onEdit}
          renderComponent={TabControlComponent}
          toggleVisibility={this.toggleVisibility}
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
    const tabs: Array<{
      id: string;
      label: string;
      isVisible: boolean;
      widgetId: string;
    }> = this.props.propertyValue.slice();
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

  updateOption = (index: number, updatedLabel: string) => {
    const tabsArray: any = Object.values(this.props.propertyValue);
    const { id: itemId } = tabsArray[index];
    this.updateProperty(
      `${this.props.propertyName}.${itemId}.label`,
      updatedLabel,
    );
  };

  addOption = () => {
    let tabs = this.props.propertyValue;
    const tabsArray = Object.values(tabs);
    const newTabId = generateReactKey({ prefix: "tab" });
    const newTabLabel = getNextEntityName(
      "Tab ",
      tabsArray.map((tab: any) => tab.label),
    );
    tabs = {
      ...tabs,
      [newTabId]: {
        id: newTabId,
        label: newTabLabel,
        widgetId: generateReactKey(),
        isVisible: true,
      },
    };

    this.updateProperty(this.props.propertyName, tabs);
  };

  static getControlType() {
    return "TABS_INPUT";
  }
}

export default TabControl;
