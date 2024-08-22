import React from "react";

import { useFocusRing } from "@react-aria/focus";
import { useSwitch } from "@react-aria/switch";
import { useToggleState } from "@react-stately/toggle";
import clsx from "classnames";

import {
  SwitchCheckedClassName,
  SwitchClassName,
  SwitchClassNameLabel,
} from "./Switch.constants";
import {
  StyledSwitch,
  StyledSwitchInput,
  StyledSwitchLabel,
} from "./Switch.styles";
import type { SwitchProps } from "./Switch.types";

function Switch(props: SwitchProps) {
  const state = useToggleState(props);
  const ref = React.useRef(null);
  const { inputProps } = useSwitch(props, state, ref);
  const { focusProps, isFocusVisible } = useFocusRing();

  return (
    // TODO: Needs refactor
    <StyledSwitch className={SwitchClassName} data-checked={state.isSelected}>
      {props.children ? (
        <StyledSwitchLabel
          className={clsx(
            SwitchClassNameLabel,
            state.isSelected && SwitchCheckedClassName,
          )}
          isDisabled={props.isDisabled}
          renderAs="label"
        >
          {props.children}
          <StyledSwitchInput
            {...inputProps}
            {...focusProps}
            isFocusVisible={isFocusVisible}
            ref={ref}
          />
        </StyledSwitchLabel>
      ) : (
        <StyledSwitchInput
          {...inputProps}
          {...focusProps}
          isFocusVisible={isFocusVisible}
          ref={ref}
        />
      )}
    </StyledSwitch>
  );
}

Switch.displayName = "Switch";

Switch.defaultProps = {};

export { Switch };
