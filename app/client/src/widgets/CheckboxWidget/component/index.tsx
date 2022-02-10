import React, { useCallback } from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import { Alignment, Classes } from "@blueprintjs/core";
import { AlignWidget } from "widgets/constants";

import { Checkbox } from "components/wds";

const CheckboxContainer = styled.div`
  && {
    padding: 0 12px;
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

  /**
   * on check change
   */
  const onCheckChange = useCallback(() => {
    props.onCheckChange(!props.isChecked);
  }, [props.isChecked, props.onCheckChange]);

  return (
    <CheckboxContainer className={checkboxAlignClass}>
      <Checkbox
        backgroundColor={props.backgroundColor}
        borderRadius={props.borderRadius}
        checked={props.isChecked}
        className={props.isLoading ? Classes.SKELETON : Classes.RUNNING_TEXT}
        disabled={props.isDisabled}
        hasError={props.isRequired && !props.isChecked}
        label={props.label}
        onChange={onCheckChange}
      />
    </CheckboxContainer>
  );
}

export interface CheckboxComponentProps extends ComponentProps {
  alignWidget?: AlignWidget;
  isChecked: boolean;
  isLoading: boolean;
  isRequired?: boolean;
  label: string;
  onCheckChange: (isChecked: boolean) => void;
  rowSpace: number;
  backgroundColor: string;
  borderRadius: string;
}

export default CheckboxComponent;
