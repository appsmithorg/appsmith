import React, { memo } from "react";
import { Icon, IconSize } from "design-system";
import { Button } from "@blueprintjs/core";
import { Colors } from "constants/Colors";

import { isEmptyOrNill } from "../../../utils/helpers";
import { StyledDiv } from "./index.styled";

export interface SelectButtonProps {
  disabled?: boolean;
  displayText?: string;
  handleCancelClick?: (event: React.MouseEvent<Element, MouseEvent>) => void;
  spanRef?: any;
  togglePopoverVisibility: () => void;
  tooltipText?: string;
  value?: string;
  hideCancelIcon?: boolean;
}

function SelectButton(props: SelectButtonProps) {
  const {
    disabled,
    displayText,
    handleCancelClick,
    hideCancelIcon,
    spanRef,
    togglePopoverVisibility,
    tooltipText,
    value,
  } = props;

  return (
    <Button
      className="select-button"
      data-testid="selectbutton.btn.main"
      disabled={disabled}
      onClick={togglePopoverVisibility}
      rightIcon={
        <StyledDiv>
          {!isEmptyOrNill(value) && !hideCancelIcon ? (
            <Icon
              className="dropdown-icon cancel-icon"
              data-testid="selectbutton.btn.cancel"
              disabled={disabled}
              fillColor={disabled ? Colors.GREY_7 : Colors.GREY_10}
              name="cross"
              onClick={handleCancelClick}
              size={IconSize.XXS}
            />
          ) : null}
          <Icon
            className="dropdown-icon"
            disabled={disabled}
            fillColor={disabled ? Colors.GREY_7 : Colors.GREY_10}
            name="dropdown"
          />
        </StyledDiv>
      }
    >
      <span ref={spanRef} title={tooltipText}>
        {displayText}
      </span>
    </Button>
  );
}

export default memo(SelectButton);
