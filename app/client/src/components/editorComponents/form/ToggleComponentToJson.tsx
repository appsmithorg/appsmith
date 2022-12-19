import React from "react";
import {
  alternateViewTypeInputConfig,
  getViewType,
  switchViewType,
  ViewTypes,
} from "components/formControls/utils";
import { AppState } from "@appsmith/reducers";
import { Action } from "entities/Action";
import { ControlProps } from "components/formControls/BaseControl";
import { connect, useSelector } from "react-redux";
import { getFormValues } from "redux-form";
import { AnyAction, bindActionCreators, Dispatch } from "redux";
import { change } from "redux-form";
import { JSToggleButton, TooltipComponent } from "design-system";
import { get } from "lodash";
import { JS_TOGGLE_DISABLED_MESSAGE } from "@appsmith/constants/messages";

type Props = {
  viewType: ViewTypes;
  customStyles: Record<string, any>;
  componentControlType: string;
  configProperty: string;
  children?: JSX.Element;
  formName: string;
  disabled: boolean | undefined;
  renderCompFunction: (config?: ControlProps) => JSX.Element;
};

type HandlerProps = {
  configProperty: string;
  formName: string;
  change: (formName: string, id: string, value: any) => void;
};

function ToggleComponentToJsonHandler(props: HandlerProps) {
  const formValues: Partial<Action> = useSelector((state: AppState) =>
    getFormValues(props.formName)(state),
  );

  const viewType = getViewType(formValues, props.configProperty);
  // variable to control
  let configPropertyPathJsonValue = "";

  if (viewType === ViewTypes.JSON) {
    // if viewType is json mode
    // get the value of the json field and store it in configPropertyPathJsonValue.
    configPropertyPathJsonValue = get(formValues, props.configProperty);
  }

  const handleViewTypeSwitch = () => {
    // only allow switching when the json value is an empty string or undefined.
    // capitalizing on falsy nature of empty strings/undefined vals.
    if (!configPropertyPathJsonValue) {
      switchViewType(
        formValues,
        props.configProperty,
        viewType,
        props.formName,
        props.change,
      );
    }
  };

  return (
    <TooltipComponent
      content={!!configPropertyPathJsonValue ? JS_TOGGLE_DISABLED_MESSAGE : ""}
    >
      <JSToggleButton
        cypressSelector={`t--${props.configProperty}-JS`}
        handleClick={handleViewTypeSwitch}
        isActive={viewType === ViewTypes.JSON}
        isToggleDisabled={!!configPropertyPathJsonValue}
      />
    </TooltipComponent>
  );
}

function ToggleComponentToJson(props: Props) {
  return props.viewType === ViewTypes.JSON
    ? props.renderCompFunction({
        ...alternateViewTypeInputConfig(),
        configProperty: props.configProperty,
        customStyles: props?.customStyles,
        formName: props.formName,
        id: props.configProperty,
      })
    : props.renderCompFunction();
}

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => {
  return bindActionCreators({ change }, dispatch);
};

const ToggleComponentToJsonHandlerWrapper = connect(
  null,
  mapDispatchToProps,
)(ToggleComponentToJsonHandler);

export { ToggleComponentToJsonHandlerWrapper as ToggleComponentToJsonHandler };

export default ToggleComponentToJson;
