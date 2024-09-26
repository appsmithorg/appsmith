import React from "react";
import _ from "lodash";
import type { WrappedFieldProps } from "redux-form";
import { Field } from "redux-form";
import DropdownFieldWrapper from "components/editorComponents/form/fields/DropdownFieldWrapper";
import type { SelectOptionProps } from "@appsmith/ads";

const renderComponent = (
  componentProps: WrappedFieldProps & SelectOptionProps,
) => {
  return <DropdownFieldWrapper {...componentProps} />;
};

function RequestDropdownField(props: SelectOptionProps) {
  return (
    <Field
      component={renderComponent}
      format={(value: string) => _.find(props.options, { value }) || undefined}
      normalize={(option: { value: string }) => option.value}
      {...props}
    />
  );
}

export default RequestDropdownField;
