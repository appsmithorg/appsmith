import React from "react";
import { noop } from "lodash";
import { ControllerRenderProps } from "react-hook-form";

import Field from "widgets/FormBuilderWidget/component/Field";
import DropDownComponent from "widgets/DropdownWidget/component";
import { DropdownOption } from "widgets/DropdownWidget/constants";
import { SchemaItem } from "../constants";

type SelectFieldOwnProps = {
  options: DropdownOption[];
};

const defaultOpts = [
  { label: "Blue", value: "BLUE" },
  { label: "Green", value: "GREEN" },
  { label: "Red", value: "RED" },
];

type SelectFieldProps = {
  name: ControllerRenderProps["name"];
  schemaItem: SchemaItem<SelectFieldOwnProps>;
};

function SelectField({ name, schemaItem }: SelectFieldProps) {
  const { label, props } = schemaItem;
  const { options = defaultOpts } = props;

  return (
    <Field
      name={name}
      render={({ field: { onBlur, onChange, ref, value } }) => {
        const selectedOptionIndex = options.findIndex(
          (option) => option.value === value,
        );
        const selectedIndex =
          selectedOptionIndex > -1 ? selectedOptionIndex : undefined;

        const onOptionSelected = (option: DropdownOption) => {
          onChange(option.value);
        };

        return (
          <DropDownComponent
            disabled={false}
            height={10}
            inputRef={ref}
            isFilterable={false}
            isLoading={false}
            label={label}
            onBlurHandler={onBlur}
            onFilterChange={noop}
            onOptionSelected={onOptionSelected}
            options={options}
            placeholder=""
            selectedIndex={selectedIndex}
            serverSideFiltering={false}
            widgetId=""
            width={10}
          />
        );
      }}
    />
  );
}

export default SelectField;
