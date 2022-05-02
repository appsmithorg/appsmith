import React from "react";
import find from "lodash/find";
// @ts-expect-error: redux-form import
import { Field, WrappedFieldProps } from "redux-form/dist/redux-form";
import DropdownFieldWrapper from "components/editorComponents/form/fields/DropdownFieldWrapper";

interface RequestDropdownProps {
  className?: string;
  name: string;
  options: Array<{
    value: string;
    label?: string;
    id?: string;
  }>;
  placeholder: string;
  width?: string;
  height?: string;
  optionWidth?: string;
}

const renderComponent = (
  componentProps: WrappedFieldProps & RequestDropdownProps,
) => {
  return <DropdownFieldWrapper {...componentProps} />;
};

function RequestDropdownField(props: RequestDropdownProps) {
  return (
    <Field
      component={renderComponent}
      format={(value: string) => find(props.options, { value }) || ""}
      normalize={(option: { value: string }) => option.value}
      {...props}
    />
  );
}

export default RequestDropdownField;
