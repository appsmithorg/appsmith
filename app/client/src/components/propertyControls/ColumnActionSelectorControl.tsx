import React from "react";
import styled from "styled-components";

import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { generateReactKey } from "utils/generators";
import { InputText } from "components/propertyControls/InputTextControl";
import ActionCreator from "components/editorComponents/ActionCreator";
import { Button } from "@appsmith/ads";

export interface ColumnAction {
  label?: string;
  id: string;
  dynamicTrigger: string;
}
const StyledDeleteButton = styled(Button)`
  padding: 5px 0px;
  position: absolute;
  right: 0px;
  cursor: pointer;
  top: 0px;
`;

const InputTextWrapper = styled.div`
  margin-bottom: 8px;
  width: calc(100% - 30px);
`;

const Wrapper = styled.div`
  margin-bottom: 8px;
`;

class ColumnActionSelectorControl extends BaseControl<ColumnActionSelectorControlProps> {
  render() {
    const { propertyName, widgetProperties } = this.props;
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
                    action={this.props.label}
                    additionalControlData={{}}
                    dataTreePath=""
                    onValueChange={this.updateColumnActionFunction.bind(
                      this,
                      columnAction,
                    )}
                    propertyName={propertyName}
                    value={columnAction.dynamicTrigger}
                    widgetName={widgetProperties.widgetName}
                    widgetType={widgetProperties.type}
                  />
                </Wrapper>
                <StyledDeleteButton
                  isIconButton
                  kind="tertiary"
                  onClick={this.removeColumnAction.bind(this, columnAction)}
                  size="sm"
                  startIcon="delete-bin-line"
                />
              </div>
            );
          })}

        <Button
          kind="secondary"
          onClick={this.addColumnAction}
          size="md"
          startIcon="plus"
        >
          New Button
        </Button>
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
