import React from "react";
import _ from "lodash";
import { DropdownProps } from "components/designSystems/appsmith/Dropdown";
import { Field } from "redux-form";
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
  isDisabled?: boolean;
}

const renderComponent = (
  componentProps: RequestDropdownProps & DropdownProps,
) => {
  return (
    <React.Fragment>
      <DropdownFieldWrapper {...componentProps} />
    </React.Fragment>
  );
};

const RequestDropdownField = (
  props: RequestDropdownProps & Partial<DropdownProps>,
) => {
  return (
    <Field
      className={props.className}
      component={renderComponent}
      format={(value: string) => _.find(props.options, { value }) || ""}
      normalize={(option: { value: string }) => option.value}
      {...props}
      isDisabled={props.isDisabled}
    />
  );
};

export default RequestDropdownField;
