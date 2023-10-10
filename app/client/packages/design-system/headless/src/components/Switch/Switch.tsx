import { mergeProps } from "@react-aria/utils";
import { useSwitch } from "@react-aria/switch";
import { useFocusRing } from "@react-aria/focus";
import { useHover } from "@react-aria/interactions";
import { useToggleState } from "@react-stately/toggle";
import { useFocusableRef } from "@react-spectrum/utils";
import { useCheckboxGroupItem } from "@react-aria/checkbox";
import React, { forwardRef, useContext, useRef } from "react";
import { useVisuallyHidden } from "@react-aria/visually-hidden";
import type { SpectrumSwitchProps } from "@react-types/switch";
import type { FocusableRef, StyleProps, Validation } from "@react-types/shared";

import { CheckboxGroupContext } from "../Checkbox";
import type { InlineLabelProps } from "../Checkbox";
import type { CheckboxGroupContextType } from "../Checkbox";

export interface SwitchProps
  extends Omit<SpectrumSwitchProps, keyof StyleProps>,
    Validation,
    InlineLabelProps {
  className?: string;
}

export type SwitchRef = FocusableRef<HTMLLabelElement>;

const _Switch = (props: SwitchProps, ref: SwitchRef) => {
  const {
    autoFocus,
    children,
    className,
    isDisabled: isDisabledProp = false,
    labelPosition = "right",
    validationState,
  } = props;
  const state = useToggleState(props);
  const inputRef = useRef<HTMLInputElement>(null);
  const domRef = useFocusableRef(ref, inputRef);
  const { visuallyHiddenProps } = useVisuallyHidden();
  const { focusProps, isFocusVisible } = useFocusRing({ autoFocus });

  // The hooks will be swapped based on whether the switch is a part of a CheckboxGroup.
  // Although this approach is not conventional since hooks cannot usually be called conditionally,
  // it should be safe in this case since the switch is not expected to be added or removed from the group.
  const context = useContext(CheckboxGroupContext) as CheckboxGroupContextType;
  const isDisabled = isDisabledProp || context?.isDisabled;
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { inputProps } = Boolean(context?.state)
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useCheckboxGroupItem(
        {
          ...props,
          // Value is optional for standalone switch, but required for CheckboxGroup items;
          // it's passed explicitly here to avoid typescript error (requires ignore).
          // @ts-expect-error value is required in switch group items
          value: props.value,
          // Only pass isRequired and validationState to react-aria if they came from
          // the props for this individual switch, and not from the group via context.
          isRequired: props.isRequired,
          validationState: props.validationState,
          isDisabled: isDisabled,
        },
        context?.state,
        inputRef,
      )
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useSwitch(props, state, inputRef);

  const dataState = Boolean(inputProps.checked) ? "checked" : "unchecked";

  return (
    <label
      {...hoverProps}
      className={className}
      data-disabled={Boolean(isDisabled) ? "" : undefined}
      data-focused={isFocusVisible ? "" : undefined}
      data-hovered={isHovered ? "" : undefined}
      data-invalid={validationState === "invalid" ? "" : undefined}
      data-label=""
      data-label-position={labelPosition}
      data-state={dataState}
      ref={domRef}
    >
      <input
        {...mergeProps(inputProps, visuallyHiddenProps, focusProps)}
        ref={inputRef}
      />
      <span aria-hidden="true" data-icon="" role="presentation" />
      {children}
    </label>
  );
};

export const Switch = forwardRef(_Switch);
