import React, { useEffect, useState } from "react";
import type { SelectOptionProps } from "design-system";
import { Select, Option } from "design-system";

function DropdownFieldWrapper(props: SelectOptionProps) {
  const selectedValueHandler = () => {
    if (
      props.input &&
      props.input.value &&
      Object.keys(props.input.value).length > 0
    ) {
      return props.input.value.value;
    } else if (props.input && typeof props.input.value === "string") {
      return props.input.value;
    } else if (props.placeholder) {
      return props.placeholder;
    }
  };
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
      value={selectedOption.value}
    >
      {props.options.map((option: SelectOptionProps) => {
        return (
          <Option key={option.id} value={option.value}>
            {option.value}
          </Option>
        );
      })}
    </Select>
  );
}

export default DropdownFieldWrapper;
