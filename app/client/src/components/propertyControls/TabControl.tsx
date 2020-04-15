import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledInputGroup, StyledPropertyPaneButton } from "./StyledControls";
import { ControlType } from "constants/PropertyControlConstants";
import styled from "constants/DefaultTheme";
import { FormIcons } from "icons/FormIcons";
import { ControlIcons } from "icons/ControlIcons";
import { AnyStyledComponent } from "styled-components";
import { DragDropContext } from "react-beautiful-dnd";
import { generateReactKey } from "utils/generators";
import { DroppableComponent } from "../designSystems/appsmith/DraggableListComponent";

const StyledDeleteIcon = styled(FormIcons.DELETE_ICON as AnyStyledComponent)`
  padding: 0;
  position: relative;
  margin-left: 15px;
  cursor: pointer;
`;

const StyledDragIcon = styled(
  ControlIcons.DRAGGABLE_CONTROL as AnyStyledComponent,
)`
  padding: 0;
  position: relative;
  margin-left: 15px;
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
    <React.Fragment>
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
      <StyledDragIcon height={20} width={20} />
    </React.Fragment>
  );
}

class TabControl extends BaseControl<ControlProps> {
  onDragEnd = (result: any) => {
    const { destination, source } = result;
    if (!destination) {
      return;
    }
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    const tabs: string[] = this.props.propertyValue || [""];
    const sourceTab = tabs[source.index];
    const destinationTab = tabs[destination.index];
    this.updateProperty(
      this.props.propertyName,
      tabs.map((tab, index) => {
        if (index === source.index) {
          return destinationTab;
        } else if (index === destination.index) {
          return sourceTab;
        }
        return tab;
      }),
    );
  };

  render() {
    const tabs: Array<{
      id: string;
      label: string;
    }> = this.props.propertyValue || [{ id: "" }];
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <DroppableComponent
          items={tabs}
          renderComponent={TabControlComponent}
          deleteOption={this.deleteOption}
          updateOption={this.updateOption}
        />
        <StyledPropertyPaneButtonWrapper>
          <StyledPropertyPaneButton
            text="Add a Tab"
            color="#FFFFFF"
            minimal
            onClick={this.addOption}
          />
        </StyledPropertyPaneButtonWrapper>
      </DragDropContext>
    );
  }

  deleteOption = (index: number) => {
    const tabs: object[] = this.props.propertyValue.slice();
    tabs.splice(index, 1);
    this.updateProperty(this.props.propertyName, tabs);
  };

  updateOption = (index: number, updatedLabel: string) => {
    const tabs: Array<{
      id: string;
      label: string;
    }> = this.props.propertyValue;
    this.updateProperty(
      this.props.propertyName,
      tabs.map((tab, tabIndex) => {
        if (index === tabIndex) {
          tab.label = updatedLabel;
        }
        return tab;
      }),
    );
  };

  addOption = () => {
    const tabs: Array<{
      id: string;
      label: string;
    }> = this.props.propertyValue ? this.props.propertyValue.slice() : [];
    const newTabId = generateReactKey({ prefix: "tab" });
    tabs.push({ id: newTabId, label: `Tab ${tabs.length + 1}` });
    this.updateProperty(this.props.propertyName, tabs);
  };

  getControlType(): ControlType {
    return "TABS_INPUT";
  }
}

export default TabControl;
