import React, { memo } from "react";
import { Icon, IconSize } from "@design-system/widgets-old";
import { Button } from "@blueprintjs/core";
import { Colors } from "constants/Colors";

import { isEmptyOrNill } from "../../../utils/helpers";
import { StyledDiv } from "./index.styled";
import { CLASSNAMES } from "../constants";

export interface SelectButtonProps {
  disabled?: boolean;
  displayText?: string;
  handleCancelClick?: (event: React.MouseEvent<Element, MouseEvent>) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spanRef?: any;
  togglePopoverVisibility: () => void;
  tooltipText?: string;
  value?: string;
  isRequired?: boolean;
  hideCancelIcon?: boolean;
}

function SelectButton(props: SelectButtonProps) {
  const {
    disabled,
    displayText,
    handleCancelClick,
    hideCancelIcon,
    isRequired,
    spanRef,
    togglePopoverVisibility,
    tooltipText,
    value,
  } = props;

  return (
    <Button
      className={CLASSNAMES.selectButton}
      data-testid="selectbutton.btn.main"
      disabled={disabled}
      onClick={togglePopoverVisibility}
      rightIcon={
        <StyledDiv>
          {!isEmptyOrNill(value) && !hideCancelIcon && !isRequired ? (
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
