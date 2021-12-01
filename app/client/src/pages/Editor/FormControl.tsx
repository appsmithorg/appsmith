import React from "react";
import { ControlProps } from "components/formControls/BaseControl";
import { isHidden } from "components/formControls/utils";
import { useSelector } from "react-redux";
import { getFormValues } from "redux-form";
import FormControlFactory from "utils/FormControlFactory";
import Indicator from "./GuidedTour/Indicator";

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
    <Indicator
      location="QUERY_EDITOR"
      modifiers={{
        offset: {
          enabled: true,
          options: {
            offset: [0, -20],
          },
        },
      }}
      position="top"
      show={props.config.configProperty === "actionConfiguration.body"}
      step={1}
      targetTagName="div"
    >
      <div className={`t--form-control-${props.config.controlType}`}>
        {FormControlFactory.createControl(
          props.config,
          props.formName,
          props?.multipleConfig,
        )}
      </div>
    </Indicator>
  );
}

export default FormControl;
