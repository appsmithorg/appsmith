import React, { forwardRef, useContext, useRef } from "react";
import { useCheckbox, useCheckboxGroupItem } from "@react-aria/checkbox";

import CheckIcon from "remixicon-react/CheckLineIcon";
import { CheckboxGroupContext } from "./context";
import SubtractIcon from "remixicon-react/SubtractLineIcon";
import classNames from "classnames";
import { mergeProps } from "@react-aria/utils";
import { useFocusRing } from "@react-aria/focus";
import { useFocusableRef } from "@react-spectrum/utils";
import { useHover } from "@react-aria/interactions";
import { useToggleState } from "@react-stately/toggle";
import { useVisuallyHidden } from "@react-aria/visually-hidden";
import type { SpectrumCheckboxProps } from "@react-types/checkbox";
import type { FocusableRef, StyleProps } from "@react-types/shared";

export interface CheckboxProps
  extends Omit<SpectrumCheckboxProps, keyof StyleProps> {
  icon?: React.ReactNode;
  className?: string;
}

export type CheckboxRef = FocusableRef<HTMLLabelElement>;

export const Checkbox = forwardRef((props: CheckboxProps, ref: CheckboxRef) => {
  const {
    className,
    icon = <CheckIcon />,
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
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
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

  const computedClassnames = classNames(className, {
    "is-disabled": isDisabled,
    "is-hovered": isHovered,
    "is-checked": inputProps.checked,
    "is-indeterminate": isIndeterminate,
    "is-invalid": validationState === "invalid",
    "is-focused": isFocusVisible,
  });

  return (
    <label {...hoverProps} className={computedClassnames} ref={domRef}>
      <input
        {...mergeProps(inputProps, visuallyHiddenProps, focusProps)}
        ref={inputRef}
      />
      <span aria-hidden="true" className="icon" role="presentation">
        {isIndeterminate ? <SubtractIcon /> : icon}
      </span>
      {children}
    </label>
  );
});
