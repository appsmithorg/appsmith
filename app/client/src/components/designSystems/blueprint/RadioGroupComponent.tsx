import React from "react";
import styled from "styled-components";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { RadioOption } from "widgets/RadioGroupWidget";
import {
  RadioGroup,
  Radio,
  ControlGroup,
  Label,
  Classes,
} from "@blueprintjs/core";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { labelStyle } from "constants/DefaultTheme";

const StyledControlGroup = styled(ControlGroup)`
  &&& {
    & > label {
      ${labelStyle}
      flex: 0 1 30%;
      align-self: flex-start;
      text-align: right;
      margin: 0 ${WIDGET_PADDING * 2}px 0 0;
    }
  }
`;

const StyledRadioGroup = styled(RadioGroup)``;

class RadioGroupComponent extends React.Component<RadioGroupComponentProps> {
  render() {
    return (
      <StyledControlGroup fill>
        {this.props.label && (
          <Label className={Classes.TEXT_OVERFLOW_ELLIPSIS}>
            {this.props.label}
          </Label>
        )}
        <StyledRadioGroup
          selectedValue={this.props.selectedOptionValue}
          onChange={this.onRadioSelectionChange}
        >
          {this.props.options.map(option => {
            return (
              <Radio
                className={this.props.isLoading ? "bp3-skeleton" : ""}
                label={option.label}
                value={option.value}
                key={option.id}
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
