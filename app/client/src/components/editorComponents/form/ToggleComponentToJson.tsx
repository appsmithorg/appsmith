import React from "react";
import {
  alternateViewTypeInputConfig,
  getViewType,
  switchViewType,
  ViewTypes,
} from "components/formControls/utils";
import type { AppState } from "@appsmith/reducers";
import type { Action } from "entities/Action";
import type { ControlProps } from "components/formControls/BaseControl";
import { connect, useSelector } from "react-redux";
import { getFormValues } from "redux-form";
import type { AnyAction, Dispatch } from "redux";
import { bindActionCreators } from "redux";
import { change } from "redux-form";
import { get } from "lodash";
import { JS_TOGGLE_DISABLED_MESSAGE } from "@appsmith/constants/messages";
import { ToggleButton, Tooltip } from "design-system";
import styled from "styled-components";

interface Props {
  viewType: ViewTypes;
  customStyles: Record<string, any>;
  componentControlType: string;
  configProperty: string;
  children?: JSX.Element;
  formName: string;
  disabled: boolean | undefined;
  renderCompFunction: (config?: ControlProps) => JSX.Element;
}

interface HandlerProps {
  configProperty: string;
  formName: string;
  change: (formName: string, id: string, value: any) => void;
}

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

  const StyledToggleButton = styled(ToggleButton)`
    margin-left: 4px;
  `;
  return (
    <Tooltip
      content={!!configPropertyPathJsonValue && JS_TOGGLE_DISABLED_MESSAGE}
      isDisabled={!configPropertyPathJsonValue}
    >
      <span>
        <StyledToggleButton
          data-testid={`t--${props.configProperty}-JS`}
          icon="js-toggle-v2"
          isDisabled={!!configPropertyPathJsonValue}
          isSelected={viewType === ViewTypes.JSON}
          onClick={handleViewTypeSwitch}
          size="sm"
        />
      </span>
    </Tooltip>
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
