import Dropdown from "components/ads/Dropdown";
import React, { useEffect, useState } from "react";

type DropdownWrapperProps = {
  placeholder: string;
  input?: {
    value?: string;
    onChange?: (value?: string) => void;
  };
  options: Array<{ id: string; value: string; label: string }>;
};

function DropdownWrapper(props: DropdownWrapperProps) {
  const [selectedOption, setSelectedOption] = useState({
    value: props.placeholder,
  });
  const onSelectHandler = (value?: string) => {
    props.input && props.input.onChange && props.input.onChange(value);
  };

  useEffect(() => {
    if (props.input && props.input.value) {
      setSelectedOption({ value: props.input.value });
    } else if (props.placeholder) {
      setSelectedOption({ value: props.placeholder });
    }
  }, [props.input, props.placeholder]);

  return (
    <Dropdown
      onSelect={onSelectHandler}
      options={props.options}
      selected={selectedOption}
    />
  );
}

export default DropdownWrapper;
