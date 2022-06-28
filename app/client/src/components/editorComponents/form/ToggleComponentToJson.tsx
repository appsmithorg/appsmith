import React from "react";
import {
  alternateViewTypeInputConfig,
  getViewType,
  switchViewType,
  ViewTypes,
} from "components/formControls/utils";
import { AppState } from "reducers";
import { Action } from "entities/Action";
import { ControlProps } from "components/formControls/BaseControl";
import { connect, useSelector } from "react-redux";
import { getFormValues } from "redux-form";
import { AnyAction, bindActionCreators, Dispatch } from "redux";
import { change } from "redux-form";
import { JSToggleButton } from "components/ads";

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

  const handleViewTypeSwitch = () => {
    switchViewType(
      formValues,
      props.configProperty,
      viewType,
      props.formName,
      props.change,
    );
  };
  return (
    <JSToggleButton
      cypressSelector={`t--${props.configProperty}-JS`}
      handleClick={handleViewTypeSwitch}
      isActive={viewType === ViewTypes.JSON}
    />
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
