import React from "react";
import clsx from "classnames";
import { useFocusRing } from "@react-aria/focus";
import { useToggleState } from "@react-stately/toggle";
import { useSwitch } from "@react-aria/switch";

import type { SwitchProps } from "./Switch.types";
import {
  StyledSwitch,
  StyledSwitchLabel,
  StyledSwitchInput,
} from "./Switch.styles";
import {
  SwitchCheckedClassName,
  SwitchClassName,
  SwitchClassNameLabel,
} from "./Switch.constants";

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
