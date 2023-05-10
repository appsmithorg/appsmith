import { mergeProps } from "@react-aria/utils";
import { useFocusRing } from "@react-aria/focus";
import { useHover } from "@react-aria/interactions";
import CheckIcon from "remixicon-react/CheckLineIcon";
import { useToggleState } from "@react-stately/toggle";
import { useFocusableRef } from "@react-spectrum/utils";
import SubtractIcon from "remixicon-react/SubtractLineIcon";
import React, { forwardRef, useContext, useRef } from "react";
import { useVisuallyHidden } from "@react-aria/visually-hidden";
import type { FocusableRef, StyleProps } from "@react-types/shared";
import type { SpectrumCheckboxProps } from "@react-types/checkbox";
import { useCheckbox, useCheckboxGroupItem } from "@react-aria/checkbox";

import { CheckboxGroupContext } from "./context";

export interface CheckboxProps
  extends Omit<SpectrumCheckboxProps, keyof StyleProps> {
  icon?: React.ReactNode;
  className?: string;
  labelPosition?: "left" | "right";
}

export type CheckboxRef = FocusableRef<HTMLLabelElement>;

const ICON_SIZE = 14;

export const Checkbox = forwardRef((props: CheckboxProps, ref: CheckboxRef) => {
  const {
    className,
    icon = <CheckIcon size={ICON_SIZE} />,
    isDisabled = false,
    isIndeterminate = false,
    children,
    autoFocus,
    validationState,
  } = props;
  const state = useToggleState(props);
  const inputRef = useRef<HTMLInputElement>(null);
  const domRef = useFocusableRef(ref, inputRef);
  const { visuallyHiddenProps } = useVisuallyHidden();
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { focusProps, isFocusVisible } = useFocusRing({ autoFocus });

  // The hooks will be swapped based on whether the checkbox is a part of a CheckboxGroup.
  // Although this approach is not conventional since hooks cannot usually be called conditionally,
  // it should be safe in this case since the checkbox is not expected to be added or removed from the group.
  const groupState = useContext(CheckboxGroupContext);
  const { inputProps } = groupState
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
        },
        groupState,
        inputRef,
      )
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useCheckbox(props, state, inputRef);

  const dataState = isIndeterminate
    ? "indeterminate"
    : inputProps.checked
    ? "checked"
    : "unchecked";

  return (
    <label
      {...hoverProps}
      className={className}
      data-disabled={isDisabled ? "" : undefined}
      data-focused={isFocusVisible ? "" : undefined}
      data-hovered={isHovered ? "" : undefined}
      data-invalid={validationState === "invalid" ? "" : undefined}
      data-label=""
      data-state={dataState}
      ref={domRef}
    >
      <input
        {...mergeProps(inputProps, visuallyHiddenProps, focusProps)}
        ref={inputRef}
      />
      <span aria-hidden="true" data-icon="" role="presentation">
        {isIndeterminate ? <SubtractIcon size={ICON_SIZE} /> : icon}
      </span>
      {children}
    </label>
  );
});
