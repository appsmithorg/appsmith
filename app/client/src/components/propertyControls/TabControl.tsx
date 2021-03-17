import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  StyledHiddenIcon,
  StyledInputGroup,
  StyledPropertyPaneButton,
  StyledVisibleIcon,
  StyledDragIcon,
  StyledDeleteIcon,
} from "./StyledControls";
import styled from "constants/DefaultTheme";
import { generateReactKey } from "utils/generators";
import { DroppableComponent } from "components/ads/DraggableListComponent";
import { getNextEntityName } from "utils/AppsmithUtils";
import _ from "lodash";
import * as Sentry from "@sentry/react";
import { Category, Size } from "components/ads/Button";

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
  padding-left: 30px;
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
};

function TabControlComponent(props: RenderComponentProps) {
  const { deleteOption, updateOption, item, index, toggleVisibility } = props;
  return (
    <ItemWrapper>
      <StyledDragIcon height={20} width={20} />
      <StyledOptionControlInputGroup
        dataType="text"
        placeholder="Tab Title"
        onChange={(value: string) => {
          updateOption(index, value);
        }}
        defaultValue={item.label}
      />
      <StyledDeleteIcon
        className="t--delete-tab-btn"
        height={20}
        width={20}
        marginRight={12}
        onClick={() => {
          deleteOption(index);
        }}
      />
      {item.isVisible || item.isVisible === undefined ? (
        <StyledVisibleIcon
          className="t--show-tab-btn"
          height={20}
          width={20}
          marginRight={36}
          onClick={() => {
            toggleVisibility && toggleVisibility(index);
          }}
        />
      ) : (
        <StyledHiddenIcon
          className="t--show-tab-btn"
          height={20}
          width={20}
          marginRight={36}
          onClick={() => {
            toggleVisibility && toggleVisibility(index);
          }}
        />
      )}
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

  updateItems = (items: Array<Record<string, unknown>>) => {
    this.updateProperty(this.props.propertyName, items);
  };

  render() {
    const tabs: Array<{
      id: string;
      label: string;
    }> = _.isString(this.props.propertyValue) ? [] : this.props.propertyValue;
    return (
      <TabsWrapper>
        <DroppableComponent
          items={tabs}
          renderComponent={TabControlComponent}
          deleteOption={this.deleteOption}
          updateOption={this.updateOption}
          updateItems={this.updateItems}
          toggleVisibility={this.toggleVisibility}
        />
        <StyledPropertyPaneButtonWrapper>
          <StyledPropertyPaneButton
            icon="plus"
            tag="button"
            type="button"
            text="Add a Tab"
            onClick={this.addOption}
            size={Size.medium}
            category={Category.tertiary}
          />
        </StyledPropertyPaneButtonWrapper>
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

  deleteOption = (index: number) => {
    let tabs: Array<Record<string, unknown>> = this.props.propertyValue.slice();
    if (tabs.length === 1) return;
    delete tabs[index];
    tabs = tabs.filter(Boolean);
    this.updateProperty(this.props.propertyName, tabs);
  };

  updateOption = (index: number, updatedLabel: string) => {
    const tabs: Array<{
      id: string;
      label: string;
    }> = this.props.propertyValue;
    const updatedTabs = tabs.map((tab, tabIndex) => {
      if (index === tabIndex) {
        return {
          ...tab,
          label: updatedLabel,
        };
      }
      return tab;
    });
    this.updateProperty(this.props.propertyName, updatedTabs);
  };

  addOption = () => {
    let tabs: Array<{
      id: string;
      label: string;
      widgetId: string;
    }> = this.props.propertyValue;
    const newTabId = generateReactKey({ prefix: "tab" });
    const newTabLabel = getNextEntityName(
      "Tab ",
      tabs.map((tab) => tab.label),
    );
    tabs = [
      ...tabs,
      { id: newTabId, label: newTabLabel, widgetId: generateReactKey() },
    ];

    this.updateProperty(this.props.propertyName, tabs);
  };

  static getControlType() {
    return "TABS_INPUT";
  }
}

export default TabControl;
