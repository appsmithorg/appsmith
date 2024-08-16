import React, { useEffect, useState } from "react";
import type { SelectOptionProps } from "@appsmith/ads";
import { Select, Option } from "@appsmith/ads";

type DropdownFieldWrapperProps = SelectOptionProps & { placeholder?: string };

function DropdownFieldWrapper(props: DropdownFieldWrapperProps) {
  const selectedValueHandler = () => {
    if (
      props.input &&
      props.input.value &&
      Object.keys(props.input.value).length > 0
    ) {
      return props.input.value.value;
    } else if (props.input && typeof props.input.value === "string") {
      return props.input.value;
    }
  };
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedOption, setSelectedOption] = useState<any>({
    value: selectedValueHandler(),
  });
  const onSelectHandler = (value?: string) => {
    props.input.onChange({ value: value });
  };

  useEffect(() => {
    setSelectedOption({ value: selectedValueHandler() });
  }, [props.input.value, props.placeholder]);

  return (
    <Select
      className={props.className}
      defaultValue={selectedOption.value}
      isDisabled={props.disabled}
      onSelect={onSelectHandler}
      placeholder={props.placeholder}
      value={selectedOption.value}
    >
      {props.options.map((option: SelectOptionProps) => {
        return (
          <Option key={option.id} value={option.value}>
            {option.label || option.value}
          </Option>
        );
      })}
    </Select>
  );
}

export default DropdownFieldWrapper;
