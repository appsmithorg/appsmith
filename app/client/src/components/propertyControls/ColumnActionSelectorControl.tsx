import React from "react";

import BaseControl, { ControlProps } from "./BaseControl";
import { StyledPropertyPaneButton } from "./StyledControls";
import { ControlType } from "constants/PropertyControlConstants";
import { generateReactKey } from "utils/generators";
import styled from "constants/DefaultTheme";
import { AnyStyledComponent } from "styled-components";
import { FormIcons } from "icons/FormIcons";
import { InputText } from "components/propertyControls/InputTextControl";
import DynamicActionCreator from "components/editorComponents/DynamicActionCreator";

export interface ColumnAction {
  label: string;
  id: string;
  dynamicTrigger: string;
}
const StyledDeleteIcon = styled(FormIcons.DELETE_ICON as AnyStyledComponent)`
  padding: 5px 0px;
  position: absolute;
  right: 8px;
  cursor: pointer;
  top: 0px;
`;

const Wrapper = styled.div`
  margin-bottom: 8px;
`;

class ColumnActionSelectorControl extends BaseControl<
  ColumnActionSelectorControlProps
> {
  render() {
    return (
      <React.Fragment>
        {this.props.propertyValue &&
          this.props.propertyValue.map((columnAction: ColumnAction) => {
            return (
              <div
                key={columnAction.id}
                style={{
                  position: "relative",
                }}
              >
                <Wrapper>
                  <InputText
                    label={columnAction.label}
                    value={columnAction.label}
                    onChange={this.updateColumnActionLabel.bind(
                      this,
                      columnAction,
                    )}
                    isValid={true}
                  />
                </Wrapper>
                <Wrapper>
                  <DynamicActionCreator
                    value={columnAction.dynamicTrigger}
                    isValid={(columnAction as any).isValid}
                    validationMessage={(columnAction as any).message}
                    onValueChange={this.updateColumnActionFunction.bind(
                      this,
                      columnAction,
                    )}
                  />
                </Wrapper>
                <StyledDeleteIcon
                  height={20}
                  width={20}
                  onClick={this.removeColumnAction.bind(this, columnAction)}
                />
              </div>
            );
          })}
        <StyledPropertyPaneButton
          text={"Column Action"}
          icon={"plus"}
          color={"#FFFFFF"}
          minimal={true}
          onClick={this.addColumnAction}
        />
      </React.Fragment>
    );
  }

  updateColumnActionLabel = (
    columnAction: ColumnAction,
    newValue: React.ChangeEvent<HTMLTextAreaElement> | string,
  ) => {
    let value = newValue;
    if (typeof newValue !== "string") {
      value = newValue.target.value;
    }
    const update = this.props.propertyValue.map((a: ColumnAction) => {
      if (a.id === columnAction.id) return { ...a, label: value };
      return a;
    });
    this.updateProperty(this.props.propertyName, update);
  };

  updateColumnActionFunction = (
    columnAction: ColumnAction,
    newValue: string,
  ) => {
    const update = this.props.propertyValue.map((a: ColumnAction) => {
      if (a.id === columnAction.id) return { ...a, dynamicTrigger: newValue };
      return a;
    });
    this.updateProperty(this.props.propertyName, update);
  };

  removeColumnAction = (columnAction: ColumnAction) => {
    const update = this.props.propertyValue.filter(
      (a: ColumnAction) => a.id !== columnAction.id,
    );
    this.updateProperty(this.props.propertyName, update);
  };
  addColumnAction = () => {
    const columnActions = this.props.propertyValue || [];
    const update = columnActions.concat([
      {
        label: "Action",
        id: generateReactKey(),
        actionPayloads: [],
      },
    ]);

    this.updateProperty(this.props.propertyName, update);
  };

  getControlType(): ControlType {
    return "COLUMN_ACTION_SELECTOR";
  }
}

export type ColumnActionSelectorControlProps = ControlProps;

export default ColumnActionSelectorControl;
