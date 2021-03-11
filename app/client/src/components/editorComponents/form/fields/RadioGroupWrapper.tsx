import RadioComponent from "components/ads/Radio";
import React, { useEffect, useState } from "react";
import { WrappedFieldInputProps } from "redux-form";

export type RadioGroupWrapperProps = {
  placeholder: string;
  input: WrappedFieldInputProps;
  options: Array<{ value: string; label: string }>;
  className?: string;
  columns?: number;
  rows?: number;
};

function RadioGroupWrapper(props: RadioGroupWrapperProps) {
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
  const [selectedOption, setSelectedOption] = useState<string>(
    selectedValueHandler(),
  );
  const onSelectHandler = (value: string) => {
    props.input.onChange({ value: value });
  };

  useEffect(() => {
    setSelectedOption(selectedValueHandler());
  }, [props.input.value, props.placeholder]);

  return (
    <RadioComponent
      className={props.className}
      columns={props.columns}
      defaultValue={selectedOption}
      onSelect={(value: string) => onSelectHandler(value)}
      options={props.options}
      rows={props.rows}
    />
  );
}

export default RadioGroupWrapper;
