import React, { memo, useMemo } from "react";
import { ControlProps } from "components/formControls/BaseControl";
import {
  getViewType,
  isHidden,
  ViewTypes,
} from "components/formControls/utils";
import { useSelector, shallowEqual } from "react-redux";
import { getFormValues } from "redux-form";
import FormControlFactory from "utils/FormControlFactory";

import { AppState } from "reducers";
import { Action } from "entities/Action";
import { EvaluationError } from "utils/DynamicBindingUtils";
import { getConfigErrors } from "selectors/formSelectors";
import ToggleComponentToJson from "components/editorComponents/form/ToggleComponentToJson";
import FormConfig from "./FormConfig";
export interface FormControlProps {
  config: ControlProps;
  formName: string;
  multipleConfig?: ControlProps[];
}

function FormControl(props: FormControlProps) {
  const formValues: Partial<Action> = useSelector((state: AppState) =>
    getFormValues(props.formName)(state),
  );

  const viewType = getViewType(formValues, props.config.configProperty);
  const hidden = isHidden(formValues, props.config.hidden);
  const configErrors: EvaluationError[] = useSelector(
    (state: AppState) =>
      getConfigErrors(state, {
        configProperty: props?.config?.configProperty,
        formName: props.formName,
      }),
    shallowEqual,
  );

  const FormConfigMemoizedValue = (config = props.config) =>
    useMemo(
      () =>
        FormControlFactory.createControl(
          config,
          props.formName,
          props?.multipleConfig,
        ),
      [props],
    );

  if (hidden) return null;
  const viewTypes: ViewTypes[] = [];
  if ("viewTypes" in props.config && Array.isArray(props.config.viewTypes)) {
    viewTypes.push(...props.config.viewTypes);
  }

  return (
    <FormConfig
      config={props.config}
      configErrors={configErrors}
      formName={props.formName}
      multipleConfig={props?.multipleConfig}
    >
      <div className={`t--form-control-${props.config.controlType}`}>
        {viewTypes.length > 0 && viewTypes.includes(ViewTypes.JSON) ? (
          <ToggleComponentToJson
            configProperty={props.config.configProperty}
            formName={props.formName}
            formValues={formValues}
            renderCompFunction={FormConfigMemoizedValue}
            viewType={viewType}
          />
        ) : (
          FormConfigMemoizedValue()
        )}
      </div>
    </FormConfig>
  );
}

// Updated the memo function to allow for disabled props to be compared
export default memo(FormControl, (prevProps, nextProps) => {
  return (
    prevProps === nextProps &&
    prevProps.config.disabled === nextProps.config.disabled
  );
});
