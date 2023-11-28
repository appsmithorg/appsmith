import React, { forwardRef } from "react";
import { Field } from "@design-system/headless";
import { useDOMRef } from "@react-spectrum/utils";
import type { DOMRef } from "@react-types/shared";
import { useRadioGroup } from "@react-aria/radio";
import { useRadioGroupState } from "@react-stately/radio";

import { RadioContext } from "./context";
import type { RadioGroupProps } from "./types";

export type RadioGroupRef = DOMRef<HTMLDivElement>;

const _RadioGroup = (props: RadioGroupProps, ref: RadioGroupRef) => {
  const {
    children,
    fieldClassName,
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
      wrapperClassName={fieldClassName}
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
