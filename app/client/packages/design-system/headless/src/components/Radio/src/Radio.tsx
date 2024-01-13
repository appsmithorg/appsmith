import { useRadio } from "@react-aria/radio";
import { mergeProps } from "@react-aria/utils";
import { useFocusRing } from "@react-aria/focus";
import { useHover } from "@react-aria/interactions";
import { useFocusableRef } from "@react-spectrum/utils";
import type { SpectrumRadioProps } from "@react-types/radio";
import React, { forwardRef, useContext, useRef } from "react";
import { useVisuallyHidden } from "@react-aria/visually-hidden";
import type { FocusableRef, StyleProps } from "@react-types/shared";

import { RadioContext } from "./context";
import type { RadioGroupContext } from "./context";
import type { InlineLabelProps } from "../../Checkbox";

export interface RadioProps
  extends Omit<SpectrumRadioProps, keyof StyleProps>,
    InlineLabelProps {
  className?: string;
}

export type RadioRef = FocusableRef<HTMLLabelElement>;

const _Radio = (props: RadioProps, ref: RadioRef) => {
  const {
    autoFocus,
    children,
    className,
    isDisabled: isDisabledProp = false,
    labelPosition = "right",
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const domRef = useFocusableRef(ref, inputRef);
  const { visuallyHiddenProps } = useVisuallyHidden();
  const radioGroupProps = useContext(RadioContext) as RadioGroupContext;
  const { state, validationState } = radioGroupProps;
  const isDisabled = isDisabledProp || radioGroupProps.isDisabled;
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { focusProps, isFocusVisible } = useFocusRing({ autoFocus });
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
      data-disabled={Boolean(isDisabled) ? "" : undefined}
      data-focused={isFocusVisible ? "" : undefined}
      data-hovered={isHovered ? "" : undefined}
      data-invalid={validationState === "invalid" ? "" : undefined}
      data-label=""
      data-label-position={labelPosition}
      data-state={state.selectedValue === props.value ? "selected" : undefined}
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

export const Radio = forwardRef(_Radio);
