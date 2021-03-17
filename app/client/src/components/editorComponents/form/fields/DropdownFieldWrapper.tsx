import Dropdown from "components/ads/Dropdown";
import React, { useEffect, useState } from "react";
import { WrappedFieldInputProps } from "redux-form";

type DropdownWrapperProps = {
  placeholder: string;
  input: WrappedFieldInputProps;
  options: Array<{ id?: string; value: string; label?: string }>;
  className?: string;
  width?: string;
  height?: string;
  optionWidth?: string;
};

const DropdownFieldWrapper = (props: DropdownWrapperProps) => {
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
    <Dropdown
      className={props.className}
      options={props.options}
      selected={selectedOption}
      onSelect={onSelectHandler}
      width={props.width}
      height={props.height}
      optionWidth={props.optionWidth}
    />
  );
};

export default DropdownFieldWrapper;
