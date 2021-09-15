import React from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import { RadioOption } from "../constants";
import {
  RadioGroup,
  Radio,
  ControlGroup,
  Label,
  Classes,
} from "@blueprintjs/core";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { BlueprintControlTransform, labelStyle } from "constants/DefaultTheme";

const StyledControlGroup = styled(ControlGroup)`
  &&& {
    & > label {
      ${labelStyle}
      flex: 0 1 30%;
      margin: 7px ${WIDGET_PADDING * 2}px 0 0;
      text-align: right;
      align-self: flex-start;
      max-width: calc(30% - ${WIDGET_PADDING}px);
    }
  }
`;

const StyledRadioGroup = styled(RadioGroup)`
  ${BlueprintControlTransform};
  label {
    margin: 7px ${WIDGET_PADDING * 2}px 0 0;
  }
`;

class RadioGroupComponent extends React.Component<RadioGroupComponentProps> {
  render() {
    return (
      <StyledControlGroup fill>
        {this.props.label && (
          <Label
            className={
              this.props.isLoading
                ? Classes.SKELETON
                : Classes.TEXT_OVERFLOW_ELLIPSIS
            }
          >
            {this.props.label}
          </Label>
        )}
        <StyledRadioGroup
          disabled={this.props.isDisabled}
          onChange={this.onRadioSelectionChange}
          selectedValue={this.props.selectedOptionValue}
        >
          {this.props.options.map((option) => {
            return (
              <Radio
                className={this.props.isLoading ? "bp3-skeleton" : ""}
                key={option.value}
                label={option.label}
                value={option.value}
              />
            );
          })}
        </StyledRadioGroup>
      </StyledControlGroup>
    );
  }

  onRadioSelectionChange = (event: React.FormEvent<HTMLInputElement>) => {
    this.props.onRadioSelectionChange(event.currentTarget.value);
  };
}

export interface RadioGroupComponentProps extends ComponentProps {
  label: string;
  options: RadioOption[];
  onRadioSelectionChange: (updatedOptionValue: string) => void;
  selectedOptionValue: string;
  isLoading: boolean;
}

export default RadioGroupComponent;
