import React, { memo } from "react";
import { Colors } from "constants/Colors";

import { isEmptyOrNill } from "../../../utils/helpers";
import { StyledDiv } from "./index.styled";
import { Button } from "@blueprintjs/core";
import { Button as AdsButton, Icon } from "design-system";

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
            <AdsButton
              className="dropdown-icon cancel-icon"
              data-testid="selectbutton.btn.cancel"
              isDisabled={disabled}
              isIconButton
              name="cross"
              onClick={handleCancelClick}
              size="sm"
            />
          ) : null}
          <Icon className="dropdown-icon" name="dropdown" />
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
