import React, { forwardRef, useRef } from "react";
import { Field } from "@design-system/headless";
import { useDOMRef } from "@react-spectrum/utils";
import type { DOMRef } from "@react-types/shared";
import { useRadioGroup } from "@react-aria/radio";
import { useRadioGroupState } from "@react-stately/radio";

import { RadioContext } from "./context";
import type { RadioGroupProps } from "./types";
import { useGroupOrientation } from "./useGroupOrientation";

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
  const parentRef = useRef<HTMLDivElement>(null);
  const output = useGroupOrientation({ orientation }, parentRef);

  console.log({ output });

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
        ref={parentRef}
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
