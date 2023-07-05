import React, { forwardRef } from "react";
import { useDOMRef } from "@react-spectrum/utils";
import type { DOMRef } from "@react-types/shared";
import { useRadioGroup } from "@react-aria/radio";
import type { StyleProps } from "@react-types/shared";
import { useRadioGroupState } from "@react-stately/radio";
import type { SpectrumRadioGroupProps } from "@react-types/radio";

import { Field } from "../Field";
import { RadioContext } from "./context";
import type { LabelProps } from "../Field";

export type RadioGroupRef = DOMRef<HTMLDivElement>;
export interface RadioGroupProps
  extends Omit<SpectrumRadioGroupProps, keyof StyleProps> {
  className?: string;
  labelWidth?: LabelProps["labelWidth"];
}

export const RadioGroup = forwardRef(
  (props: RadioGroupProps, ref: RadioGroupRef) => {
    const {
      children,
      className,
      isDisabled = false,
      orientation = "vertical",
      validationState,
    } = props;
    const domRef = useDOMRef(ref);
    const state = useRadioGroupState(props);
    const { descriptionProps, errorMessageProps, labelProps, radioGroupProps } =
      useRadioGroup(props, state);

    return (
      <Field
        {...props}
        descriptionProps={descriptionProps}
        errorMessageProps={errorMessageProps}
        includeNecessityIndicatorInAccessibilityName
        labelProps={labelProps}
        ref={domRef}
        wrapperClassName={className}
      >
        <div
          {...radioGroupProps}
          data-field-group=""
          data-orientation={orientation}
        >
          <RadioContext.Provider
            value={{
              validationState,
              state,
              isDisabled,
            }}
          >
            {children}
          </RadioContext.Provider>
        </div>
      </Field>
    );
  },
);
