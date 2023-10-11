import React, { forwardRef } from "react";
import { useDOMRef } from "@react-spectrum/utils";
import type { DOMRef } from "@react-types/shared";
import { useRadioGroup } from "@react-aria/radio";
import type { StyleProps } from "@react-types/shared";
import { useRadioGroupState } from "@react-stately/radio";
import type { SpectrumRadioGroupProps } from "@react-types/radio";

import { RadioContext } from "./context";
import { Field } from "@design-system/headless";

export type RadioGroupRef = DOMRef<HTMLDivElement>;
export interface RadioGroupProps
  extends Omit<
    SpectrumRadioGroupProps,
    keyof StyleProps | "labelPosition" | "labelAlign" | "isEmphasized"
  > {
  className?: string;
}

const _RadioGroup = (props: RadioGroupProps, ref: RadioGroupRef) => {
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
      fieldType="field-group"
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
};

export const RadioGroup = forwardRef(_RadioGroup);
