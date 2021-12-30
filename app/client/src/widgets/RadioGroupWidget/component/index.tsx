import React, { useCallback } from "react";
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
import { Colors } from "constants/Colors";
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

const StyledRadioGroup = styled(RadioGroup)<{
  backgroundColor: string;
}>`
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

  .${Classes.CONTROL} {
    & input:checked ~ .${Classes.CONTROL_INDICATOR} {
      background: ${({ backgroundColor }) => `${backgroundColor}`} !important;
      border: 1px solid ${({ backgroundColor }) => `${backgroundColor}`} !important;
    }
  }

  .${Classes.SWITCH} {
    & input:not(:disabled):active:checked ~ .${Classes.CONTROL_INDICATOR} {
      background: ${({ backgroundColor }) => `${backgroundColor}`};
    }
  }
`;

function RadioGroupComponent(props: RadioGroupComponentProps) {
  /**
   * on radio selection change
   */
  const onRadioSelectionChange = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      props.onRadioSelectionChange(event.currentTarget.value);
    },
    [props.onRadioSelectionChange],
  );

  return (
    <StyledControlGroup fill>
      {props.label && (
        <Label
          className={
            props.isLoading ? Classes.SKELETON : Classes.TEXT_OVERFLOW_ELLIPSIS
          }
        >
          {props.label}
        </Label>
      )}
      <StyledRadioGroup
        backgroundColor={props.backgroundColor}
        disabled={props.isDisabled}
        onChange={onRadioSelectionChange}
        selectedValue={props.selectedOptionValue}
      >
        {props.options.map((option, optInd) => {
          return (
            <Radio
              className={props.isLoading ? "bp3-skeleton" : ""}
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

export interface RadioGroupComponentProps extends ComponentProps {
  label: string;
  options: RadioOption[];
  onRadioSelectionChange: (updatedOptionValue: string) => void;
  selectedOptionValue: string;
  isLoading: boolean;
  backgroundColor: string;
}

export default RadioGroupComponent;
