import { mergeProps } from "@react-aria/utils";
import { useFocusRing } from "@react-aria/focus";
import { useHover } from "@react-aria/interactions";
import { useFocusableRef } from "@react-spectrum/utils";
import React, { forwardRef, useContext, useRef } from "react";
import { useVisuallyHidden } from "@react-aria/visually-hidden";
import type { SpectrumRadioProps } from "@react-types/radio";
import type { FocusableRef, StyleProps } from "@react-types/shared";
import { useRadio } from "@react-aria/radio";
import type { RadioGroupContext } from "./context";
import { RadioContext } from "./context";

export interface RadioProps extends Omit<SpectrumRadioProps, keyof StyleProps> {
  icon?: React.ReactNode;
  className?: string;
}

export type RadioRef = FocusableRef<HTMLLabelElement>;

export const Radio = forwardRef((props: RadioProps, ref: RadioRef) => {
  const { autoFocus, children, className, isDisabled = false } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const domRef = useFocusableRef(ref, inputRef);
  const { visuallyHiddenProps } = useVisuallyHidden();
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { focusProps, isFocusVisible } = useFocusRing({ autoFocus });

  const radioGroupProps = useContext(RadioContext) as RadioGroupContext;
  const { state, validationState } = radioGroupProps;

  const { inputProps } = useRadio(
    {
      ...props,
      ...radioGroupProps,
      isDisabled,
    },
    state,
    inputRef,
  );

  return (
    <label
      {...hoverProps}
      className={className}
      data-disabled={isDisabled ? "" : undefined}
      data-focused={isFocusVisible ? "" : undefined}
      data-hovered={isHovered ? "" : undefined}
      data-invalid={validationState === "invalid" ? "" : undefined}
      data-label=""
      data-state={state.selectedValue === props.value ? "selected" : ""}
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
});
