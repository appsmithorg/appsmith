import React from "react";
import { noop, pick } from "lodash";

import Field from "widgets/FormBuilderWidget/component/Field";
import DropDownComponent, {
  DropDownComponentProps,
} from "widgets/DropdownWidget/component";
import { BaseFieldComponentProps } from "./types";
import { CONFIG } from "widgets/DropdownWidget";
import { DropdownOption } from "widgets/DropdownWidget/constants";

const COMPONENT_DEFAULT_VALUES = pick(CONFIG.defaults, [
  "serverSideFiltering",
  "isFilterable",
]);

type PICKED_DEFAULT_PROPS = keyof typeof COMPONENT_DEFAULT_VALUES;

type SelectComponentOwnProps = Pick<
  DropDownComponentProps,
  PICKED_DEFAULT_PROPS
> & {
  isDisabled: boolean;
  options: DropdownOption[];
};

type SelectFieldProps = BaseFieldComponentProps<SelectComponentOwnProps>;

function SelectField({ name, schemaItem, ...rest }: SelectFieldProps) {
  const { label, props } = schemaItem;
  const { options = [], isDisabled = false, ...restSchemaItemProps } = props;

  return (
    <Field
      {...rest}
      label={label}
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
            {...restSchemaItemProps}
            disabled={isDisabled}
            height={10}
            inputRef={ref}
            isLoading={false}
            label=""
            onBlurHandler={onBlur}
            onFilterChange={noop}
            onOptionSelected={onOptionSelected}
            options={options}
            placeholder=""
            selectedIndex={selectedIndex}
            widgetId=""
            width={10}
          />
        );
      }}
    />
  );
}

SelectField.componentDefaultValues = {
  ...COMPONENT_DEFAULT_VALUES,
  options: [
    { label: "Blue", value: "BLUE" },
    { label: "Green", value: "GREEN" },
    { label: "Red", value: "RED" },
  ],
};

export default SelectField;
