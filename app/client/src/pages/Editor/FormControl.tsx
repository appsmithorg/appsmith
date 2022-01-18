import React from "react";
import { ControlProps } from "components/formControls/BaseControl";
import { isHidden } from "components/formControls/utils";
import { useSelector } from "react-redux";
import { getFormValues } from "redux-form";
import FormControlFactory from "utils/FormControlFactory";
import Tooltip from "components/ads/Tooltip";
import {
  FormLabel,
  FormInputHelperText,
  FormInputAnchor,
  FormInputErrorText,
  FormInfoText,
  FormSubtitleText,
  FormInputSwitchToJsonButton,
} from "components/editorComponents/form/fields/StyledFormComponents";
import { FormIcons } from "icons/FormIcons";
import { AppState } from "reducers";
import { Action } from "entities/Action";
import _ from "lodash";
import {
  EvaluationError,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
interface FormControlProps {
  config: ControlProps;
  formName: string;
  multipleConfig?: ControlProps[];
}

function FormControl(props: FormControlProps) {
  const formValues: Partial<Action> = useSelector((state: AppState) =>
    getFormValues(props.formName)(state),
  );

  // get the datatree from the state
  const dataTree = useSelector((state: AppState) => state.evaluations.tree);

  // action that corresponds to this form control
  let action: any;
  let configErrors: EvaluationError[] = [];

  // if form value exists, use the name of the form(which is the action's name) to get the action details
  // from the data tree, then store it in the action variable
  if (formValues && formValues.name) {
    if (formValues.name in dataTree) {
      // get action details from data tree
      action = dataTree[formValues.name];

      // extract the error object from the action's details object.
      const actionError = action && action?.__evaluation__?.errors;

      // get the configProperty for this form control and format it to resemble the format used in the action details errors object.
      const formattedConfig = _.replace(
        props?.config?.configProperty,
        "actionConfiguration",
        "config",
      );

      // grab the errors specific to this configProperty and store it in configErrors.
      if (actionError && formattedConfig in actionError) {
        configErrors = actionError[formattedConfig];
      }
    }
  }

  const hidden = isHidden(formValues, props.config.hidden);

  if (hidden) return null;

  return (
    <FormConfig
      config={props.config}
      configErrors={configErrors}
      formName={props.formName}
      multipleConfig={props?.multipleConfig}
    >
      <div className={`t--form-control-${props.config.controlType}`}>
        {FormControlFactory.createControl(
          props.config,
          props.formName,
          props?.multipleConfig,
        )}
      </div>
    </FormConfig>
  );
}

interface FormConfigProps extends FormControlProps {
  children: JSX.Element;
  configErrors: EvaluationError[];
}
// top contains label, subtitle, urltext, tooltip, dispaly type
// bottom contains the info and error text
// props.children will render the form element
function FormConfig(props: FormConfigProps) {
  let top, bottom;

  if (props.multipleConfig?.length) {
    top = (
      <div style={{ display: "flex" }}>
        {props.multipleConfig?.map((config) => {
          return renderFormConfigTop({ config });
        })}
      </div>
    );
    bottom = props.multipleConfig?.map((config) => {
      return renderFormConfigBottom({ config });
    });
    return (
      <>
        {top}
        {props.children}
        {bottom}
      </>
    );
  }

  return (
    <div>
      <div
        style={{
          // TODO: replace condition with props.config.dataType === "TOGGLE"
          // label and form element is rendered side by side for CHECKBOX and SWITCH
          display:
            props.config.controlType === "SWITCH" ||
            props.config.controlType === "CHECKBOX"
              ? "flex"
              : "block",
        }}
      >
        {props.config.controlType === "CHECKBOX" ? (
          <>
            {props.children}
            {renderFormConfigTop({ config: props.config })}
          </>
        ) : (
          <>
            {renderFormConfigTop({ config: props.config })}
            {props.children}
          </>
        )}
      </div>
      {renderFormConfigBottom({
        config: props.config,
        configErrors: props.configErrors,
      })}
    </div>
  );
}

export default FormControl;

function renderFormConfigTop(props: { config: ControlProps }) {
  const {
    displayType,
    encrypted,
    isRequired,
    label,
    subtitle,
    tooltipText = "",
    url,
    urlText,
  } = { ...props.config };
  return (
    <React.Fragment key={props.config.label}>
      <FormLabel config={props.config}>
        <p className="label-icon-wrapper">
          {label} {isRequired && "*"}{" "}
          {encrypted && (
            <>
              <FormIcons.LOCK_ICON height={12} keepColors width={12} />
              <FormSubtitleText config={props.config}>
                Encrypted
              </FormSubtitleText>
            </>
          )}
          {tooltipText && (
            <Tooltip content={tooltipText} hoverOpenDelay={1000}>
              <FormIcons.HELP_ICON height={16} width={16} />
            </Tooltip>
          )}
        </p>
        {subtitle && (
          <FormInfoText config={props.config}>{subtitle}</FormInfoText>
        )}
      </FormLabel>
      {urlText && (
        <FormInputAnchor href={url} target="_blank">
          {urlText}
        </FormInputAnchor>
      )}
      {displayType && (
        <FormInputSwitchToJsonButton type="button">
          {displayType === "JSON" ? "SWITCH TO GUI" : "SWITCH TO JSON EDITOR"}
        </FormInputSwitchToJsonButton>
      )}
    </React.Fragment>
  );
}

function renderFormConfigBottom(props: {
  config: ControlProps;
  configErrors?: EvaluationError[];
}) {
  const { info } = { ...props.config };
  return (
    <>
      {info && <FormInputHelperText>{info}</FormInputHelperText>}
      {props.configErrors &&
        props.configErrors.length > 0 &&
        props.configErrors
          .filter(
            (error) =>
              error.errorType === PropertyEvaluationErrorType.VALIDATION,
          )
          .map((error, index) => (
            <FormInputErrorText key={index}>
              {`* ${error?.errorMessage}`}
            </FormInputErrorText>
          ))}
    </>
  );
}
