import React from "react";
import { FormInputSwitchToJsonButton } from "components/editorComponents/form/fields/StyledFormComponents";
import {
  alternateViewTypeInputConfig,
  switchViewType,
  ViewTypes,
} from "components/formControls/utils";
import { ControlProps } from "components/formControls/BaseControl";
import { connect } from "react-redux";
import { AnyAction, bindActionCreators, Dispatch } from "redux";
import { change } from "redux-form";

type Props = {
  viewType: ViewTypes;
  configProperty: string;
  children?: JSX.Element;
  formName: string;
  formValues: any;
  renderCompFunction: (config?: ControlProps) => JSX.Element;
  change: (formName: string, id: string, value: any) => void;
};

function ToggleComponentToJson(props: Props) {
  const handleViewTypeSwitch = () => {
    switchViewType(
      props.formValues,
      props.configProperty,
      props.viewType,
      props.formName,
      props.change,
    );
  };

  return (
    <>
      <FormInputSwitchToJsonButton onClick={handleViewTypeSwitch} type="button">
        {`SWITCH TO ${
          props.viewType === ViewTypes.JSON ? "GUI" : "JSON"
        } EDITOR`}
      </FormInputSwitchToJsonButton>
      {props.viewType === ViewTypes.JSON
        ? props.renderCompFunction({
            ...alternateViewTypeInputConfig,
            configProperty: props.configProperty,
            formName: props.formName,
            id: props.configProperty,
          })
        : props.renderCompFunction()}
    </>
  );
}

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => {
  return bindActionCreators({ change }, dispatch);
};

export default connect(null, mapDispatchToProps)(ToggleComponentToJson);
