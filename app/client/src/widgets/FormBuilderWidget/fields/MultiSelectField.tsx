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

type DateComponentOwnProps = Pick<MultiSelectProps, PICKED_DEFAULT_PROPS>;

type MultiSelectFieldProps = BaseFieldComponentProps<DateComponentOwnProps>;
function MultiSelectField({ name, schemaItem }: MultiSelectFieldProps) {
  const { label, props } = schemaItem;

  return (
    <Field
      label={label}
      name={name}
      render={({ field: { onBlur, onChange, ref, value } }) => (
        <MultiSelect
          {...props}
          disabled={false}
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

MultiSelectField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default MultiSelectField;
