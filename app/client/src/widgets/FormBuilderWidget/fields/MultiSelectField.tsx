import { noop } from "lodash";
import React from "react";

import Field from "widgets/FormBuilderWidget/component/Field";
import MultiSelect, {
  MultiSelectProps,
} from "widgets/MultiSelectWidget/component";
import { BaseFieldComponentProps } from "./types";
import { CONFIG } from "widgets/MultiSelectWidget";
import { Layers } from "constants/Layers";

const COMPONENT_DEFAULT_VALUES = {
  placeholder: CONFIG.defaults.placeholderText,
  serverSideFiltering: CONFIG.defaults.serverSideFiltering,
};

type PICKED_DEFAULT_PROPS = keyof typeof COMPONENT_DEFAULT_VALUES;

type DateComponentOwnProps = Pick<MultiSelectProps, PICKED_DEFAULT_PROPS> & {
  isDisabled: boolean;
};

type MultiSelectFieldProps = BaseFieldComponentProps<DateComponentOwnProps>;
function MultiSelectField({
  name,
  schemaItem,
  ...rest
}: MultiSelectFieldProps) {
  const { label, props } = schemaItem;
  const { isDisabled, ...restSchemaItemProps } = props;

  return (
    <Field
      {...rest}
      label={label}
      name={name}
      render={({ field: { onBlur, onChange, ref, value } }) => (
        <MultiSelect
          {...restSchemaItemProps}
          disabled={isDisabled}
          dropdownStyle={{
            zIndex: Layers.dropdownModalWidget,
          }}
          loading={false}
          onChange={onChange}
          onFilterChange={noop}
          options={[]}
          placeholder="Multi Select"
          serverSideFiltering={false}
          value={value}
        />
      )}
    />
  );
}

MultiSelectField.componentDefaultValues = {
  ...COMPONENT_DEFAULT_VALUES,
  isDisabled: false,
};

export default MultiSelectField;
