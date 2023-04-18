import classNames from "classnames";
import { mergeProps } from "@react-aria/utils";
import { useFocusRing } from "@react-aria/focus";
import React, { forwardRef, useRef } from "react";
import { useCheckbox } from "@react-aria/checkbox";
import { useHover } from "@react-aria/interactions";
import CheckIcon from "remixicon-react/CheckLineIcon";
import { useToggleState } from "@react-stately/toggle";
import { useFocusableRef } from "@react-spectrum/utils";
import type { FocusableRef } from "@react-types/shared";
import SubtractIcon from "remixicon-react/SubtractLineIcon";
import { useVisuallyHidden } from "@react-aria/visually-hidden";
import type { SpectrumCheckboxProps } from "@react-types/checkbox";

export interface CheckboxProps extends SpectrumCheckboxProps {
  id?: string;
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
  const { inputProps } = useCheckbox(props, state, inputRef);
  const { focusProps, isFocusVisible } = useFocusRing({ autoFocus });

  const computedClassnames = classNames(className, {
    "is-disabled": isDisabled,
    "is-hovered": isHovered,
    "is-checked": state.isSelected,
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
