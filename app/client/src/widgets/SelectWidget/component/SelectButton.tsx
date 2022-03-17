import React, { memo } from "react";
import Icon, { IconSize } from "components/ads/Icon";
import { Button } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { isNil } from "lodash";

import { isString } from "../../../utils/helpers";
import { StyledDiv } from "./index.styled";

export const isEmptyOrNill = (value: any) => {
  return isNil(value) || (isString(value) && value === "");
};

interface SelectButtonProps {
  disabled?: boolean;
  displayText?: string;
  handleCancelClick?: (event: React.MouseEvent<Element, MouseEvent>) => void;
  togglePopoverVisibility: () => void;
  value?: string;
}

function SelectButton(props: SelectButtonProps) {
  const {
    disabled,
    displayText,
    handleCancelClick,
    togglePopoverVisibility,
    value,
  } = props;
  return (
    <Button
      disabled={disabled}
      onClick={togglePopoverVisibility}
      rightIcon={
        <StyledDiv>
          {!isEmptyOrNill(value) ? (
            <Icon
              className="dropdown-icon cancel-icon"
              fillColor={disabled ? Colors.GREY_7 : Colors.GREY_10}
              name="cross"
              onClick={handleCancelClick}
              size={IconSize.XXS}
            />
          ) : null}
          <Icon
            className="dropdown-icon"
            fillColor={disabled ? Colors.GREY_7 : Colors.GREY_10}
            name="dropdown"
          />
        </StyledDiv>
      }
      text={displayText}
    />
  );
}

export default memo(SelectButton);
