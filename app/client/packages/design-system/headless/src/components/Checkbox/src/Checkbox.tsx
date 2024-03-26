import { mergeProps } from "@react-aria/utils";
import { useFocusRing } from "@react-aria/focus";
import { useHover } from "@react-aria/interactions";
import { useToggleState } from "@react-stately/toggle";
import { useFocusableRef } from "@react-spectrum/utils";
import React, { forwardRef, useContext, useRef } from "react";
import { useVisuallyHidden } from "@react-aria/visually-hidden";
import type { SpectrumCheckboxProps } from "@react-types/checkbox";
import type { FocusableRef, StyleProps } from "@react-types/shared";
import { useCheckbox, useCheckboxGroupItem } from "@react-aria/checkbox";

import { CheckIcon } from "./icons/CheckIcon";
import { CheckboxGroupContext } from "./context";
import { SubtractIcon } from "./icons/SubtractIcon";
import { Icon as HeadlessIcon } from "../../Icon";
import type { CheckboxGroupContextType } from "./context";

export interface InlineLabelProps {
  labelPosition?: "left" | "right";
}

export interface CheckboxProps
  extends Omit<SpectrumCheckboxProps, keyof StyleProps>,
    InlineLabelProps {
  icon?: React.ComponentType;
  className?: string;
}

export type CheckboxRef = FocusableRef<HTMLLabelElement>;

const _Checkbox = (props: CheckboxProps, ref: CheckboxRef) => {
  const {
    autoFocus,
    children,
    className,
    icon: Icon = CheckIcon,
    isDisabled: isDisabledProp = false,
    isIndeterminate = false,
    labelPosition = "right",
    validationState,
  } = props;
  const state = useToggleState(props);
  const inputRef = useRef<HTMLInputElement>(null);
  const domRef = useFocusableRef(ref, inputRef);
  const { visuallyHiddenProps } = useVisuallyHidden();
  const { focusProps, isFocusVisible } = useFocusRing({ autoFocus });

  // The hooks will be swapped based on whether the checkbox is a part of a CheckboxGroup.
  // Although this approach is not conventional since hooks cannot usually be called conditionally,
  // it should be safe in this case since the checkbox is not expected to be added or removed from the group.
  const context = useContext(CheckboxGroupContext) as CheckboxGroupContextType;
  const isDisabled = isDisabledProp || context?.isDisabled;
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { inputProps } = Boolean(context?.state)
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useCheckboxGroupItem(
        {
          ...props,
          // Value is optional for standalone checkboxes, but required for CheckboxGroup items;
          // it's passed explicitly here to avoid typescript error (requires ignore).
          // @ts-expect-error value is required in checkbox group items
          value: props.value,
          // Only pass isRequired and validationState to react-aria if they came from
          // the props for this individual checkbox, and not from the group via context.
          isRequired: props.isRequired,
          validationState: props.validationState,
          isDisabled: isDisabled,
        },
        context?.state,
        inputRef,
      )
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useCheckbox(props, state, inputRef);

  const dataState = isIndeterminate
    ? "indeterminate"
    : Boolean(inputProps.checked)
    ? "checked"
    : "unchecked";

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
      <span aria-hidden="true" data-icon="" role="presentation">
        <HeadlessIcon>
          {isIndeterminate ? <SubtractIcon /> : <Icon />}
        </HeadlessIcon>
      </span>
      {children}
    </label>
  );
};

export const Checkbox = forwardRef(_Checkbox);
