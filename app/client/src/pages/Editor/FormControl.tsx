import React, { memo, useMemo, useState } from "react";
import type { ControlProps } from "components/formControls/BaseControl";
import {
  getViewType,
  isHidden,
  ViewTypes,
} from "components/formControls/utils";
import { useSelector, shallowEqual, useDispatch } from "react-redux";
import { getFormValues, change } from "redux-form";
import FormControlFactory from "utils/formControl/FormControlFactory";

import type { AppState } from "@appsmith/reducers";
import type { Action } from "entities/Action";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { getConfigErrors } from "selectors/formSelectors";
import ToggleComponentToJson from "components/editorComponents/form/ToggleComponentToJson";
import FormConfig from "./FormConfig";
import { QUERY_BODY_FIELDS } from "constants/QueryEditorConstants";
import { convertObjectToQueryParams, getQueryParams } from "utils/URLUtils";
import { QUERY_EDITOR_FORM_NAME } from "@appsmith/constants/forms";
import history from "utils/history";
import TemplateMenu from "pages/Editor/QueryEditor/TemplateMenu";
import { getAction } from "selectors/entitiesSelector";
import { get } from "lodash";

export interface FormControlProps {
  config: ControlProps;
  formName: string;
  multipleConfig?: ControlProps[];
}

function FormControl(props: FormControlProps) {
  const formValues: Partial<Action> = useSelector((state: AppState) =>
    getFormValues(props.formName)(state),
  );
  const actionValues = useSelector((state: AppState) =>
    getAction(state, formValues?.id || ""),
  );

  const dispatch = useDispatch();

  // adding this to prevent excessive rerendering
  const [convertFormToRaw, setConvertFormToRaw] = useState(false);

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

  // moving creation of template to the formControl layer, this way any formControl created can potentially have a template system.
  const isNewQuery =
    new URLSearchParams(window.location.search).get("showTemplate") === "true";
  const isQueryBodyField = QUERY_BODY_FIELDS.includes(
    props?.config?.configProperty,
  );

  const showTemplate =
    isNewQuery && formValues?.datasource?.pluginId && isQueryBodyField;

  const updateQueryParams = () => {
    const params = getQueryParams();
    if (params.showTemplate) {
      params.showTemplate = "false";
    }
    history.replace({
      ...window.location,
      search: convertObjectToQueryParams(params),
    });
  };

  // if the field is a queryBody field and if the action object is present
  if (isQueryBodyField && actionValues) {
    // get the misc data object
    const miscFormData = actionValues?.actionConfiguration?.formData?.misc;
    // if the misc data object is available and if the status of the form to raw conversion is successful
    if (
      !!miscFormData &&
      miscFormData?.formToNativeQuery &&
      miscFormData.formToNativeQuery?.status === "SUCCESS"
    ) {
      const configPathValue = get(actionValues, props.config?.configProperty);
      if (
        !convertFormToRaw &&
        typeof configPathValue === "undefined" &&
        miscFormData.formToNativeQuery?.data
      ) {
        setConvertFormToRaw(true);
        dispatch(
          change(
            props?.formName || QUERY_EDITOR_FORM_NAME,
            props?.config?.configProperty,
            miscFormData.formToNativeQuery?.data,
          ),
        );
        updateQueryParams();
      }
    }
  }

  const createTemplate = (
    template: string,
    formName: string,
    configProperty: string,
  ) => {
    updateQueryParams();
    dispatch(
      change(formName || QUERY_EDITOR_FORM_NAME, configProperty, template),
    );
  };

  const FormControlRenderMethod = (config = props.config) => {
    return FormControlFactory.createControl(
      config,
      props.formName,
      props?.multipleConfig,
    );
  };

  const viewTypes: ViewTypes[] = [];
  if (
    "alternateViewTypes" in props.config &&
    Array.isArray(props.config.alternateViewTypes)
  ) {
    viewTypes.push(...props.config.alternateViewTypes);
  }

  return useMemo(
    () =>
      !hidden ? (
        <FormConfig
          changesViewType={
            !!(viewTypes.length > 0 && viewTypes.includes(ViewTypes.JSON))
          }
          config={props.config}
          configErrors={configErrors}
          formName={props.formName}
          multipleConfig={props?.multipleConfig}
        >
          <div
            className={`t--form-control-${props.config.controlType}`}
            data-replay-id={btoa(props.config.configProperty)}
          >
            {showTemplate && !convertFormToRaw ? (
              <TemplateMenu
                createTemplate={(templateString: string) =>
                  createTemplate(
                    templateString,
                    props?.formName,
                    props?.config?.configProperty,
                  )
                }
                pluginId={formValues?.datasource?.pluginId || ""}
              />
            ) : viewTypes.length > 0 && viewTypes.includes(ViewTypes.JSON) ? (
              <ToggleComponentToJson
                componentControlType={props.config.controlType}
                configProperty={props.config.configProperty}
                customStyles={props?.config?.customStyles}
                disabled={props.config.disabled}
                formName={props.formName}
                renderCompFunction={FormControlRenderMethod}
                viewType={viewType}
              />
            ) : (
              FormControlRenderMethod()
            )}
          </div>
        </FormConfig>
      ) : null,
    [props],
  );
}

// Updated the memo function to allow for disabled props to be compared
export default memo(FormControl, (prevProps, nextProps) => {
  return (
    prevProps === nextProps &&
    prevProps.config.disabled === nextProps.config.disabled
  );
});
