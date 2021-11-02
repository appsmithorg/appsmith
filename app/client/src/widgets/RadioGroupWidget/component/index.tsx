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
import { Colors } from "constants/Colors";

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
  .${Classes.CONTROL} {
    display: flex;
    align-items: center;
    margin-bottom: 0;
    min-height: 36px;
    margin: 0px 12px;
    color: ${Colors.GREY_10};

    &:hover {
      & input:not(:checked) ~ .bp3-control-indicator {
        border: 1px solid ${Colors.GREY_5} !important;
      }
    }
    & .bp3-control-indicator {
      border: 1px solid ${Colors.GREY_3};
    }
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
          {this.props.options.map((option, optInd) => {
            return (
              <Radio
                className={this.props.isLoading ? "bp3-skeleton" : ""}
                key={optInd}
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
