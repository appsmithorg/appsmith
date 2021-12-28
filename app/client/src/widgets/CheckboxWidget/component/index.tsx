import React, { useCallback } from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import { Alignment, Checkbox, Classes } from "@blueprintjs/core";
import { AlignWidget } from "widgets/constants";
import { Colors } from "constants/Colors";
import { FALLBACK_COLORS } from "constants/ThemeConstants";

type StyledCheckboxProps = {
  rowSpace: number;
  disabled?: boolean;
  checked?: boolean;
  backgroundColor: string;
  borderRadius: string;
  boxShadow?: string;
};

type StyledCheckboxContainerProps = {
  isValid: boolean;
};

const CheckboxContainer = styled.div<StyledCheckboxContainerProps>`
  && {
    padding: 9px 12px;
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: flex-start;
    width: 100%;
    &.${Alignment.RIGHT} {
      justify-content: flex-end;
    }

    & .bp3-control-indicator {
      border: ${(props) =>
        !props.isValid && `1px solid ${props.theme.colors.error} !important`};
    }
  }
`;

export const StyledCheckbox = styled(Checkbox)<StyledCheckboxProps>`
  height: ${({ rowSpace }) => rowSpace}px;
  color: ${({ checked }) => (checked ? Colors.GREY_10 : Colors.GREY_9)};

  &.bp3-control.bp3-checkbox .bp3-control-indicator {
    border: 1px solid ${Colors.GREY_3};
    box-shadow: none;
    outline: none !important;
    background: transparent;
    border-radius: ${({ borderRadius }) => borderRadius};

    ${({ backgroundColor, checked }) =>
      checked
        ? `
        background: ${backgroundColor} !important;
        background-image: none;
        box-shadow: none;
        border: none !important;
        &::before {
          background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='14' height='14' /%3E%3Cpath d='M10.1039 3.5L11 4.40822L5.48269 10L2.5 6.97705L3.39613 6.06883L5.48269 8.18305L10.1039 3.5Z' fill='white'/%3E%3C/svg%3E%0A") !important;
        }
        `
        : ``}
    ${({ disabled }) => (disabled ? `opacity: 0.5;` : ``)}
  }

  &:hover {
    &.bp3-control.bp3-checkbox .bp3-control-indicator {
      ${({ disabled }) =>
        disabled ? "" : `border: 1px solid ${Colors.GREY_5}`};
      ${({ checked }) =>
        checked
          ? `
        background-image: linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.2),
          rgba(0, 0, 0, 0.2)
        );
        box-shadow: none;
        `
          : ""};
    }
  }

  &.${Classes.CONTROL}.${Classes.DISABLED} {
    color: ${Colors.GREY_8};
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
    <CheckboxContainer
      className={checkboxAlignClass}
      isValid={!(props.isRequired && !props.isChecked)}
    >
      <StyledCheckbox
        alignIndicator={checkboxAlignClass}
        backgroundColor={props.backgroundColor}
        borderRadius={props.borderRadius}
        checked={props.isChecked}
        className={props.isLoading ? Classes.SKELETON : Classes.RUNNING_TEXT}
        disabled={props.isDisabled}
        label={props.label}
        onChange={onCheckChange}
        rowSpace={props.rowSpace}
      />
    </CheckboxContainer>
  );
}

CheckboxComponent.defaultProps = {
  backgroundColor: FALLBACK_COLORS.backgroundColor,
};

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
