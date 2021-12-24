import React from "react";
import { ControlProps } from "components/formControls/BaseControl";
import { isHidden } from "components/formControls/utils";
import { useSelector } from "react-redux";
import { getFormValues } from "redux-form";
import FormControlFactory from "utils/FormControlFactory";

interface FormControlProps {
  config: ControlProps;
  formName: string;
  multipleConfig?: ControlProps[];
}

function FormControl(props: FormControlProps) {
  const formValues = useSelector((state) =>
    getFormValues(props.formName)(state),
  );
  const hidden = isHidden(formValues, props.config.hidden);

  if (hidden) return null;

  return (
    <div
      className={`t--form-control-${props.config.controlType}`}
      data-replay-id={btoa(props.config.configProperty)}
    >
      {FormControlFactory.createControl(
        props.config,
        props.formName,
        props?.multipleConfig,
      )}
    </div>
  );
}

export default FormControl;
