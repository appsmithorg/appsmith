import React, { forwardRef } from "react";
import Icon from "../Icon";
import { Input, useInputProps } from "../Input";
import { SelectItem } from "../Select/types";
import { InputWrapperBaseProps } from "../Input/InputWrapper/InputWrapper";
import { InputSharedProps } from "../Input/Input";

export interface NativeSelectProps
  extends InputWrapperBaseProps,
    InputSharedProps,
    React.ComponentPropsWithoutRef<"select"> {
  /** id is used to bind input and label, if not passed unique id will be generated for each input */
  id?: string;

  /** Data used to render options */
  data: (string | SelectItem)[];

  /** Props passed to root element (InputWrapper component) */
  wrapperProps?: Record<string, any>;
}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  (props, ref) => {
    const {
      data,
      inputProps,
      onChange,
      rightSection,
      rightSectionWidth,
      value,
      wrapperProps,
      ...others
    } = useInputProps(props);

    const formattedData = data.map((item: any) =>
      typeof item === "string" ? { label: item, value: item } : item,
    );

    const options = formattedData.map((item: any) => (
      <option disabled={item.disabled} key={item.value} value={item.value}>
        {item.label}
      </option>
    ));

    return (
      <Input.Wrapper {...wrapperProps}>
        <Input<"select">
          {...inputProps}
          {...others}
          component="select"
          onChange={onChange}
          ref={ref}
          trailingVisual={<Icon name="chevron-down" />}
          value={value === null ? "" : value}
        >
          {options}
        </Input>
      </Input.Wrapper>
    );
  },
);

// NativeSelect.displayName = "@mantine/core/NativeSelect";
