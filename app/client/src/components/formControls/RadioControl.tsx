import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  CalloutV2,
  OptionProps,
  RadioComponent,
  Text,
  TextType,
} from "design-system-old";
import { ControlType } from "constants/PropertyControlConstants";
import {
  change,
  Field,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";
import { connect } from "react-redux";
import log from "loglevel";
import FormControl from "pages/Editor/FormControl";
import { isNil } from "lodash";
import styled from "styled-components";

const StyledRadioComponent = styled(RadioComponent)`
  label {
    margin-bottom: 4px;
    margin-top: 16px;
  }
`;

const StyledCalloutV2 = styled.div`
  max-width: 560px;
`;

type Props = RadioControlProps & ReduxDispatchProps;

class RadioControl extends BaseControl<Props> {
  componentDidMount() {
    console.log("Component Mounted: ", this.props);
  }
  render() {
    const styles = {
      width: "280px",
      ...("customStyles" in this.props &&
      typeof this.props.customStyles === "object"
        ? this.props.customStyles
        : {}),
    };

    return (
      <Field
        component={renderRadio}
        name={this.props.configProperty}
        props={{ ...this.props, width: styles.width }}
      />
    );
  }

  getControlType(): ControlType {
    return "RADIO";
  }
}

function renderRadio(
  props: {
    input?: WrappedFieldInputProps;
    meta?: Partial<WrappedFieldMetaProps>;
    width: string;
  } & Props,
): JSX.Element {
  // set default value
  let defaultVal = "";
  if (isNil(props.input?.value)) {
    defaultVal = props?.initialValue ? (props.initialValue as string) : "";
  } else {
    defaultVal = props.input?.value;
  }

  const onSelectOptions = (option: string) => {
    if (!!option) {
      props.input?.onChange(option);
    }
  };

  const renderConfig = (config: any, multipleConfig?: ControlProps[]) => {
    multipleConfig = multipleConfig || [];
    try {
      return (
        <div style={{ marginLeft: "24px" }}>
          {config?.helpText ? (
            <Text style={{ marginBottom: "16px" }} type={TextType.P2}>
              {config?.helpText}
            </Text>
          ) : null}
          {config?.callout ? (
            <StyledCalloutV2>
              <CalloutV2
                actionLabel={config?.callout?.actionLabel}
                desc={config?.callout?.description}
                showCrossIcon={config?.callout?.showCrossIcon}
                title={config?.callout?.title}
                type={config?.callout?.type}
                url={config?.callout?.url}
              />
            </StyledCalloutV2>
          ) : null}
          {config.configProperty ? (
            <div key={config.configProperty} style={{ marginBottom: "16px" }}>
              <FormControl
                config={config}
                formName={props.formName}
                multipleConfig={multipleConfig}
              />
            </div>
          ) : null}
        </div>
      );
    } catch (e) {
      log.error(e);
    }
  };

  return (
    <StyledRadioComponent
      className={`t--${props?.configProperty}`}
      defaultValue={defaultVal}
      onSelect={onSelectOptions}
      options={props.options}
      rows={props.options.length}
      selectedOptionElements={props?.schema.map((config: any) =>
        renderConfig(config),
      )}
    />
  );
}

export interface RadioControlProps extends ControlProps {
  options: OptionProps[];
}

type ReduxDispatchProps = {
  updateConfigPropertyValue: (
    formName: string,
    field: string,
    value: any,
  ) => void;
};

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  updateConfigPropertyValue: (formName: string, field: string, value: any) => {
    dispatch(change(formName, field, value));
  },
});

export default connect(() => {
  return {};
}, mapDispatchToProps)(RadioControl);
