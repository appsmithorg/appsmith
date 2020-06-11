import React, { ChangeEvent } from "react";
import {
  Field,
  BaseFieldProps,
  WrappedFieldInputProps,
  formValueSelector,
} from "redux-form";
import DynamicAutocompleteInput, {
  DynamicAutocompleteInputProps,
} from "components/editorComponents/DynamicAutocompleteInput";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import { AppState } from "reducers";
import { connect } from "react-redux";
import { Datasource } from "api/DatasourcesApi";
import _ from "lodash";

type Props = DynamicAutocompleteInputProps & {
  input: Partial<WrappedFieldInputProps>;
  datasource: Datasource;
};

const regExp = /(https?:\/{2}\S+)(\/\S*?)$/;

class EmbeddedDatasourcePathComponent extends React.Component<Props> {
  handleOnChange = (value: ChangeEvent<string> | string) => {
    if (typeof value === "string") {
      if (this.props.input.onChange) {
        const isValid = regExp.test(value);
        if (isValid) {
          const matches = value.match(regExp);
          if (matches && matches.length) {
            const datasource = `${matches[1]}`;
            const path = matches[2];
            this.props.input.onChange(path);
          }
        }
      }
    }
  };

  render() {
    const {
      datasource,
      input: { value },
    } = this.props;
    const datasourceUrl = _.get(datasource, "datasourceConfiguration.url", "");
    const displayValue = `${datasourceUrl}${value}`;

    const input = {
      ...this.props.input,
      value: displayValue,
      onChange: this.handleOnChange,
    };

    const props = {
      ...this.props,
      input,
    };

    return <DynamicAutocompleteInput {...props} />;
  }
}

const apiFormValueSelector = formValueSelector(API_EDITOR_FORM_NAME);

const mapStateToProps = (state: AppState) => {
  return {
    datasource: apiFormValueSelector(state, "datasource"),
  };
};

const EmbeddedDatasourcePathConnectedComponent = connect(mapStateToProps)(
  EmbeddedDatasourcePathComponent,
);

const EmbeddedDatasourcePathField = (
  props: DynamicAutocompleteInputProps & BaseFieldProps,
) => {
  return (
    <Field component={EmbeddedDatasourcePathConnectedComponent} {...props} />
  );
};

export default EmbeddedDatasourcePathField;
