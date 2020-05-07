import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { formValueSelector, change } from "redux-form";
import Select from "react-select";
import { POST_BODY_FORMAT_OPTIONS } from "constants/ApiEditorConstants";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import FormLabel from "components/editorComponents/FormLabel";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import { AppState } from "reducers";

const DropDownContainer = styled.div`
  width: 232px;
  margin: 5px;
  margin-bottom: 21px;
`;

const PostbodyContainer = styled.div`
  margin-top: 41px;
`;

const JSONEditorFieldWrapper = styled.div`
  margin: 5px;
`;
export interface RapidApiAction {
  editable: boolean;
  mandatory: boolean;
  description: string;
  key: string;
  value?: string;
  type: string;
}

interface PostDataProps {
  actionConfiguration: any;
  displayFormat: any;
  actionConfigurationHeaders?: any;
  change: Function;
  onDisplayFormatChange: Function;
}
type Props = PostDataProps;

const PostBodyData = (props: Props) => {
  const {
    onDisplayFormatChange,
    actionConfigurationHeaders,
    displayFormat,
  } = props;
  return (
    <PostbodyContainer>
      <FormLabel>{"Post Body"}</FormLabel>
      <DropDownContainer>
        <Select
          defaultValue={POST_BODY_FORMAT_OPTIONS[0]}
          placeholder="Format"
          isSearchable={false}
          onChange={(displayFormatObject: any) => {
            const elementsIndex = actionConfigurationHeaders.findIndex(
              (element: { key: string; value: string }) =>
                element.key === "content-type",
            );

            if (elementsIndex >= 0 && displayFormatObject) {
              const updatedHeaders = [...actionConfigurationHeaders];

              updatedHeaders[elementsIndex] = {
                ...updatedHeaders[elementsIndex],
                value: displayFormatObject.value,
              };

              onDisplayFormatChange(updatedHeaders);
            }
          }}
          value={displayFormat}
          width={232}
          options={POST_BODY_FORMAT_OPTIONS}
        />
      </DropDownContainer>

      {displayFormat?.value === POST_BODY_FORMAT_OPTIONS[0].value && (
        <React.Fragment>
          <JSONEditorFieldWrapper>
            <DynamicTextField
              name="actionConfiguration.body[0]"
              height={300}
              showLineNumbers
              allowTabIndent
              singleLine={false}
            />
          </JSONEditorFieldWrapper>
        </React.Fragment>
      )}

      {displayFormat?.value === POST_BODY_FORMAT_OPTIONS[1].value && (
        <React.Fragment>
          <KeyValueFieldArray name="actionConfiguration.body[1]" label="" />
        </React.Fragment>
      )}
    </PostbodyContainer>
  );
};

const selector = formValueSelector(API_EDITOR_FORM_NAME);

const mapDispatchToProps = (dispatch: any) => ({
  onDisplayFormatChange: (value: []) =>
    dispatch(
      change(API_EDITOR_FORM_NAME, "actionConfiguration.headers", value),
    ),
});

export default connect((state: AppState) => {
  const apiId = selector(state, "id");
  const extraFormData = state.ui.apiPane.extraformData[apiId] || {};
  const headers = selector(state, "actionConfiguration.headers");
  let contentType;
  if (headers) {
    contentType = headers.find((header: any) => header.key === "content-type");
  }

  return {
    displayFormat:
      extraFormData["displayFormat"] || POST_BODY_FORMAT_OPTIONS[0],
    contentType,
  };
}, mapDispatchToProps)(PostBodyData);
