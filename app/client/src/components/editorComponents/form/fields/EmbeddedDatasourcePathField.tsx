import React from "react";
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

type Props = DynamicAutocompleteInputProps & {
  input: Partial<WrappedFieldInputProps>;
};

class EmbeddedDatasourcePathComponent extends React.Component<Props> {
  render() {
    return <DynamicAutocompleteInput {...this.props} />;
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
