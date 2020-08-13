import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledInputGroup, StyledPropertyPaneButton } from "./StyledControls";
import styled from "constants/DefaultTheme";
import { FormIcons } from "icons/FormIcons";
import { ControlIcons } from "icons/ControlIcons";
import { AnyStyledComponent } from "styled-components";
import { generateReactKey } from "utils/generators";
import { DroppableComponent } from "../designSystems/appsmith/DraggableListComponent";
import { getNextEntityName } from "utils/AppsmithUtils";
import _ from "lodash";

const StyledDeleteIcon = styled(FormIcons.DELETE_ICON as AnyStyledComponent)`
  padding: 0;
  position: relative;
  margin-left: 15px;
  cursor: pointer;
`;

const StyledDragIcon = styled(ControlIcons.DRAG_CONTROL as AnyStyledComponent)`
  padding: 0;
  position: relative;
  margin-right: 15px;
  cursor: move;
  svg {
    path {
      fill: ${props => props.theme.colors.paneSectionLabel};
    }
  }
`;

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
  &&& {
    input {
      border: none;
      color: ${props => props.theme.colors.textOnDarkBG};
      background: ${props => props.theme.colors.paneInputBG};
      &:focus {
        border: none;
        color: ${props => props.theme.colors.textOnDarkBG};
        background: ${props => props.theme.colors.paneInputBG};
      }
    }
  }
`;

type RenderComponentProps = {
  index: number;
  item: {
    label: string;
  };
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
};

function TabControlComponent(props: RenderComponentProps) {
  const { deleteOption, updateOption, item, index } = props;
  return (
    <ItemWrapper>
      <StyledDragIcon height={20} width={20} />
      <StyledOptionControlInputGroup
        type="text"
        placeholder="Tab Title"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          updateOption(index, event.target.value);
        }}
        defaultValue={item.label}
      />
      <StyledDeleteIcon
        height={20}
        width={20}
        onClick={() => {
          deleteOption(index);
        }}
      />
    </ItemWrapper>
  );
}

class TabControl extends BaseControl<ControlProps> {
  updateItems = (items: object[]) => {
    this.updateProperty(this.props.propertyName, JSON.stringify(items));
  };

  render() {
    const tabs: Array<{
      id: string;
      label: string;
    }> = _.isString(this.props.propertyValue)
      ? JSON.parse(this.props.propertyValue)
      : this.props.propertyValue;
    return (
      <TabsWrapper>
        <DroppableComponent
          items={tabs}
          renderComponent={TabControlComponent}
          deleteOption={this.deleteOption}
          updateOption={this.updateOption}
          updateItems={this.updateItems}
        />
        <StyledPropertyPaneButtonWrapper>
          <StyledPropertyPaneButton
            text="Add a Tab"
            color="#FFFFFF"
            minimal
            onClick={this.addOption}
          />
        </StyledPropertyPaneButtonWrapper>
      </TabsWrapper>
    );
  }

  deleteOption = (index: number) => {
    const tabs: object[] = _.isString(this.props.propertyValue)
      ? JSON.parse(this.props.propertyValue).slice()
      : this.props.propertyValue.slice();
    tabs.splice(index, 1);
    this.updateProperty(this.props.propertyName, JSON.stringify(tabs));
  };

  updateOption = (index: number, updatedLabel: string) => {
    const tabs: Array<{
      id: string;
      label: string;
    }> = _.isString(this.props.propertyValue)
      ? JSON.parse(this.props.propertyValue)
      : this.props.propertyValue;
    const updatedTabs = tabs.map((tab, tabIndex) => {
      if (index === tabIndex) {
        tab.label = updatedLabel;
      }
      return tab;
    });
    this.updateProperty(this.props.propertyName, JSON.stringify(updatedTabs));
  };

  addOption = () => {
    const tabs: Array<{
      id: string;
      label: string;
    }> = _.isString(this.props.propertyValue)
      ? JSON.parse(this.props.propertyValue)
      : this.props.propertyValue;
    const newTabId = generateReactKey({ prefix: "tab" });
    const newTabLabel = getNextEntityName(
      "Tab ",
      tabs.map(tab => tab.label),
    );
    tabs.push({ id: newTabId, label: newTabLabel });
    this.updateProperty(this.props.propertyName, JSON.stringify(tabs));
  };

  static getControlType() {
    return "TABS_INPUT";
  }
}

export default TabControl;
