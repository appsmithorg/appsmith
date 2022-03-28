import React from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import { Alignment, Classes } from "@blueprintjs/core";
import { AlignWidget } from "widgets/constants";

import { Checkbox } from "components/wds";

const CheckboxContainer = styled.div<{
  noContainerPadding?: boolean;
}>`
  && {
    padding: ${({ noContainerPadding }) =>
      noContainerPadding ? 0 : "0px 12px"};
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: flex-start;
    width: 100%;

    &.${Alignment.RIGHT} {
      justify-content: flex-end;
    }
  }
`;

function CheckboxComponent(props: CheckboxComponentProps) {
  const checkboxAlignClass =
    props.alignWidget === "RIGHT" ? Alignment.RIGHT : Alignment.LEFT;

  // If the prop isValid has a value true/false (it was explicitly passed to this component),
  // it take priority over the internal logic to determine if the field is valid or not.
  const isValid = (() => {
    if (props.isValid !== undefined) {
      return props.isValid;
    }

    return !(props.isRequired && !props.isChecked);
  })();

  /**
   * on check change
   */
  const onCheckChange = () => {
    props.onCheckChange(!props.isChecked);
  };

  return (
    <CheckboxContainer
      className={checkboxAlignClass}
      noContainerPadding={props.noContainerPadding}
    >
      <Checkbox
        backgroundColor={props.backgroundColor}
        borderRadius={props.borderRadius}
        checked={props.isChecked}
        className={props.isLoading ? Classes.SKELETON : Classes.RUNNING_TEXT}
        disabled={props.isDisabled}
        hasError={props.isRequired && !props.isChecked}
        inputRef={props.inputRef}
        label={props.label}
        onChange={onCheckChange}
      />
    </CheckboxContainer>
  );
}

export interface CheckboxComponentProps extends ComponentProps {
  alignWidget?: AlignWidget;
  noContainerPadding?: boolean;
  isChecked: boolean;
  isLoading: boolean;
  isRequired?: boolean;
  isValid?: boolean;
  label: string;
  onCheckChange: (isChecked: boolean) => void;
  rowSpace: number;
  backgroundColor: string;
  borderRadius: string;
  inputRef?: (el: HTMLInputElement | null) => any;
}

export default CheckboxComponent;
