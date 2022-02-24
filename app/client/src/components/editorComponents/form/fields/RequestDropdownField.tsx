import React from "react";
import FormControl from "pages/Editor/FormControl";
import { DATASOURCE_REST_API_FORM } from "constants/forms";

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
}

function RequestDropdownField(props: RequestDropdownProps) {
  const config = {
    id: "",
    isValid: false,
    isRequired: true,
    controlType: "DROP_DOWN",
    configProperty: props.name,
    options: props.options.map((option: { value: string }) => {
      return { label: option.value, value: option.value };
    }),
    label: "",
    placeholderText: props.placeholder,
    height: props.height,
    customStyles: {
      height: props.height,
      width: props.width,
    },
    formName: DATASOURCE_REST_API_FORM,
    className: props.className,
  };
  return (
    <FormControl
      config={config}
      formName={DATASOURCE_REST_API_FORM}
      multipleConfig={[]}
    />
  );
}

export default RequestDropdownField;
