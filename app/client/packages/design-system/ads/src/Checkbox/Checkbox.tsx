import React from "react";
import { useCheckbox } from "@react-aria/checkbox";
import { useToggleState } from "@react-stately/toggle";
import { useFocusRing } from "@react-aria/focus";
import clsx from "classnames";

import type { CheckboxProps } from "./Checkbox.types";
import { StyledCheckbox } from "./Checkbox.styles";
import {
  CheckboxClassName,
  CheckboxClassNameSquare,
} from "./Checkbox.constants";

function Checkbox(props: CheckboxProps) {
  const { children, className, isDisabled, isIndeterminate } = props;
  const state = useToggleState(props);
  const ref = React.useRef(null);
  const { inputProps } = useCheckbox(props, state, ref);
  const { focusProps, isFocusVisible } = useFocusRing();

  return (
    <StyledCheckbox
      className={clsx(CheckboxClassName, className)}
      data-checked={state.isSelected}
      isChecked={state.isSelected}
      isDisabled={isDisabled}
      isFocusVisible={isFocusVisible}
      isIndeterminate={isIndeterminate}
    >
      <span>{children}</span>
      <input {...inputProps} {...focusProps} ref={ref} />
      <span className={CheckboxClassNameSquare} />
    </StyledCheckbox>
  );
}

Checkbox.displayName = "Checkbox";

Checkbox.defaultProps = {
  isIndeterminate: false,
  isDisabled: false,
};

export { Checkbox };
