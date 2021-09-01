import React from "react";

import BaseControl, { ControlProps } from "./BaseControl";
import { StyledPropertyPaneButton } from "./StyledControls";
import { generateReactKey } from "utils/generators";
import styled from "constants/DefaultTheme";
import { AnyStyledComponent } from "styled-components";
import { FormIcons } from "icons/FormIcons";
import { InputText } from "components/propertyControls/InputTextControl";
import { ActionCreator } from "components/editorComponents/ActionCreator";
import { Size, Category } from "components/ads/Button";
export interface ColumnAction {
  label?: string;
  id: string;
  dynamicTrigger: string;
}
const StyledDeleteIcon = styled(FormIcons.DELETE_ICON as AnyStyledComponent)`
  padding: 5px 0px;
  position: absolute;
  right: 0px;
  cursor: pointer;
  top: 0px;
  && svg path {
    fill: ${(props) => props.theme.colors.propertyPane.deleteIconColor};
  }
`;

const InputTextWrapper = styled.div`
  margin-bottom: 8px;
  width: calc(100% - 30px);
`;

const Wrapper = styled.div`
  margin-bottom: 8px;
`;

class ColumnActionSelectorControl extends BaseControl<
  ColumnActionSelectorControlProps
> {
  render() {
    return (
      <>
        {this.props.propertyValue &&
          this.props.propertyValue.map((columnAction: ColumnAction) => {
            return (
              <div
                key={columnAction.id}
                style={{
                  position: "relative",
                }}
              >
                <InputTextWrapper>
                  <InputText
                    evaluatedValue={columnAction.label}
                    label={columnAction.label || ""}
                    onChange={this.updateColumnActionLabel.bind(
                      this,
                      columnAction,
                    )}
                    theme={this.props.theme}
                    value={columnAction.label as string}
                  />
                </InputTextWrapper>
                <Wrapper>
                  <ActionCreator
                    onValueChange={this.updateColumnActionFunction.bind(
                      this,
                      columnAction,
                    )}
                    value={columnAction.dynamicTrigger}
                  />
                </Wrapper>
                <StyledDeleteIcon
                  height={20}
                  onClick={this.removeColumnAction.bind(this, columnAction)}
                  width={20}
                />
              </div>
            );
          })}

        <StyledPropertyPaneButton
          category={Category.tertiary}
          icon="plus"
          onClick={this.addColumnAction}
          size={Size.medium}
          tag="button"
          text="New Button"
          type="button"
        />
      </>
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

  static getControlType() {
    return "COLUMN_ACTION_SELECTOR";
  }
}

export type ColumnActionSelectorControlProps = ControlProps;

export default ColumnActionSelectorControl;
