import { noop } from "lodash";
import React from "react";
import { ControllerRenderProps } from "react-hook-form";

import MultiSelect, {
  MultiSelectProps,
} from "widgets/MultiSelectWidget/component";
import Field from "widgets/FormBuilderWidget/component/Field";
import { Layers } from "constants/Layers";

type MultiSelectFieldProps = MultiSelectProps & {
  name: ControllerRenderProps["name"];
};

function MultiSelectField({ name, ...rest }: MultiSelectFieldProps) {
  return (
    <Field
      name={name}
      render={({ field: { onBlur, onChange, ref, value } }) => (
        <MultiSelect
          {...rest}
          disabled={false}
          dropdownStyle={{
            zIndex: Layers.dropdownModalWidget,
          }}
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

export default MultiSelectField;
