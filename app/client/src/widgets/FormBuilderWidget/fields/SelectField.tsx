import React, { useContext } from "react";
import styled from "styled-components";
import { pick } from "lodash";

import Field from "widgets/FormBuilderWidget/component/Field";
import FormContext from "../FormContext";
import DropDownComponent from "widgets/DropdownWidget/component";
import { DropdownOption } from "widgets/DropdownWidget/constants";
import { BaseFieldComponentProps, FieldComponentBaseProps } from "../constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

type MetaProps = {
  filterText?: string;
};

type SelectComponentProps = FieldComponentBaseProps &
  MetaProps & {
    placeholderText?: string;

    options: DropdownOption[];
    onOptionChange?: string;
    serverSideFiltering: boolean;
    onFilterUpdate?: string;
    isFilterable: boolean;
  };

const COMPONENT_DEFAULT_VALUES: SelectComponentProps = {
  isDisabled: false,
  isVisible: true,
  label: "",
  serverSideFiltering: false,
  isFilterable: false,
  options: [
    { label: "Blue", value: "BLUE" },
    { label: "Green", value: "GREEN" },
    { label: "Red", value: "RED" },
  ],
};

export type SelectFieldProps = BaseFieldComponentProps<SelectComponentProps>;

const StyledSelectWrapper = styled.div`
  width: 100%;
`;

function SelectField({
  name,
  propertyPath,
  schemaItem,
  ...rest
}: SelectFieldProps) {
  const { executeAction, updateWidgetMetaProperty } = useContext(FormContext);
  const labelStyles = pick(schemaItem, [
    "labelStyle",
    "labelTextColor",
    "labelTextSize",
  ]);

  const onFilterChange = (value: string) => {
    updateWidgetMetaProperty(`${propertyPath}.filterText`, value);

    if (schemaItem.onFilterUpdate) {
      executeAction({
        triggerPropertyName: "onFilterUpdate",
        dynamicString: schemaItem.onFilterUpdate,
        event: {
          type: EventType.ON_FILTER_UPDATE,
        },
      });
    }
  };

  return (
    <Field
      {...rest}
      defaultValue={schemaItem.defaultValue}
      label={schemaItem.label}
      labelStyles={labelStyles}
      name={name}
      render={({ field: { onChange, value } }) => {
        const selectedOptionIndex = schemaItem.options.findIndex(
          (option) => option.value === value,
        );
        const selectedIndex =
          selectedOptionIndex > -1 ? selectedOptionIndex : undefined;

        const onOptionSelected = (option: DropdownOption) => {
          onChange(option.value);

          if (schemaItem.onOptionChange && executeAction) {
            executeAction({
              triggerPropertyName: "onOptionChange",
              dynamicString: schemaItem.onOptionChange,
              event: {
                type: EventType.ON_OPTION_CHANGE,
              },
            });
          }
        };

        return (
          <StyledSelectWrapper>
            <DropDownComponent
              compactMode={false}
              disabled={schemaItem.isDisabled}
              dropDownWidth={100}
              height={10}
              isFilterable={schemaItem.isFilterable}
              isLoading={false}
              // TODO: Fix isValid with 'state' derived props
              isValid
              onFilterChange={onFilterChange}
              onOptionSelected={onOptionSelected}
              options={schemaItem.options}
              placeholder={schemaItem.placeholderText}
              selectedIndex={selectedIndex}
              serverSideFiltering={schemaItem.serverSideFiltering}
              widgetId=""
              width={10}
            />
          </StyledSelectWrapper>
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
