import React from "react";

import BaseControl, { ControlProps } from "./BaseControl";
import { ControlWrapper, StyledPropertyPaneButton } from "./StyledControls";
import { ControlType } from "constants/PropertyControlConstants";
import { AppState } from "reducers";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { connect } from "react-redux";
import { ActionPayload } from "constants/ActionConstants";
import { FinalActionSelector } from "./ActionSelectorControl";
import { generateReactKey } from "utils/generators";
import styled, { theme } from "constants/DefaultTheme";
import { AnyStyledComponent } from "styled-components";
import { FormIcons } from "icons/FormIcons";
export interface ColumnAction {
  label: string;
  id: string;
  actionPayloads: ActionPayload[];
}

const StyledDeleteIcon = styled(FormIcons.DELETE_ICON as AnyStyledComponent)`
  padding: 5px 5px;
  position: absolute;
  right: 0px;
  cursor: pointer;
  top: 23px;
`;

class ColumnActionSelectorControl extends BaseControl<
  ColumnActionSelectorControlProps & ActionDataState
> {
  render() {
    return (
      <ControlWrapper orientation={"VERTICAL"}>
        {this.props.propertyValue &&
          this.props.propertyValue.map(
            (columnAction: ColumnAction, index: number) => {
              return (
                <div
                  key={columnAction.id}
                  style={{
                    position: "relative",
                    // position: "absolute",
                  }}
                >
                  <FinalActionSelector
                    identifier={columnAction.id}
                    actionsData={this.props.data}
                    actions={columnAction.actionPayloads}
                    updateActions={this.updateActions}
                    label={columnAction.label}
                    labelEditable={true}
                    updateLabel={this.updateLabel}
                  ></FinalActionSelector>
                  <StyledDeleteIcon
                    height={20}
                    width={20}
                    onClick={this.removeColumnAction.bind(this, index)}
                  ></StyledDeleteIcon>
                </div>
              );
            },
          )}
        <StyledPropertyPaneButton
          text={"Column Action"}
          icon={"plus"}
          color={"#FFFFFF"}
          minimal={true}
          onClick={this.addColumnAction}
        ></StyledPropertyPaneButton>
      </ControlWrapper>
    );
  }
  onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    let value = event;
    if (typeof event !== "string") {
      value = event.target.value;
    }
    this.updateProperty(this.props.propertyName, value);
  };
  updateActions = (actions: ActionPayload[], key?: string) => {
    const columnActions = this.props.propertyValue || [];
    const columnActionsClone = columnActions.slice();
    const foundColumnActionIndex = columnActionsClone.findIndex(
      (columnAction: ColumnAction) => columnAction.id === key,
    );

    if (foundColumnActionIndex !== -1) {
      let foundColumnAction = columnActionsClone[foundColumnActionIndex];
      foundColumnAction = Object.assign({}, foundColumnAction);
      foundColumnAction.actionPayloads = actions;

      columnActionsClone.splice(foundColumnActionIndex, 1, foundColumnAction);
    }

    this.updateProperty(this.props.propertyName, columnActionsClone);
  };
  updateLabel = (label: string, key: string) => {
    const columnActions = this.props.propertyValue || [];
    const columnActionsClone = columnActions.slice();
    const foundColumnActionIndex = columnActionsClone.findIndex(
      (columnAction: ColumnAction) => columnAction.id === key,
    );

    if (foundColumnActionIndex !== -1) {
      let foundColumnAction = columnActionsClone[foundColumnActionIndex];
      foundColumnAction = Object.assign({}, foundColumnAction);
      foundColumnAction.label = label;

      columnActionsClone.splice(foundColumnActionIndex, 1, foundColumnAction);
    }

    this.updateProperty(this.props.propertyName, columnActionsClone);
  };
  removeColumnAction = (index: number) => {
    const columnActions = this.props.propertyValue || [];
    const columnActionsClone = columnActions.slice();
    columnActionsClone.splice(index, 1);

    this.updateProperty(this.props.propertyName, columnActionsClone);
  };
  addColumnAction = () => {
    const columnActions = this.props.propertyValue || [];
    const columnActionsClone = columnActions.slice();
    columnActionsClone.push({
      label: "newColumnAction",
      id: generateReactKey(),
      actionPayloads: [],
    });

    this.updateProperty(this.props.propertyName, columnActionsClone);
  };
  onToggle = () => {
    this.updateProperty(this.props.propertyName, !this.props.propertyValue);
  };

  getControlType(): ControlType {
    return "COLUMN_ACTION_SELECTOR";
  }
}

export type ColumnActionSelectorControlProps = ControlProps;

const mapStateToProps = (state: AppState): ActionDataState => ({
  ...state.entities.actions,
});

export default connect(mapStateToProps)(ColumnActionSelectorControl);
