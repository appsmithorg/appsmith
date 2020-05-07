import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { formValueSelector, change, Field } from "redux-form";
import Select from "react-select";
import {
  POST_BODY_FORMAT_OPTIONS,
  POST_BODY_FORMATS,
} from "constants/ApiEditorConstants";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import FormLabel from "components/editorComponents/FormLabel";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import { AppState } from "reducers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

const DropDownContainer = styled.div`
  width: 300px;
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
  apiId: string;
  setDisplayFormat: Function;
}

type Props = PostDataProps;

const PostBodyData = (props: Props) => {
  const {
    onDisplayFormatChange,
    actionConfigurationHeaders,
    displayFormat,
    setDisplayFormat,
    apiId,
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
            if (
              displayFormatObject &&
              displayFormatObject.value === POST_BODY_FORMATS[2]
            ) {
              setDisplayFormat(apiId, {
                label: POST_BODY_FORMATS[2],
                value: POST_BODY_FORMATS[2],
              });

              return;
            }

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
            } else {
              setDisplayFormat(apiId, {
                label: POST_BODY_FORMATS[2],
                value: POST_BODY_FORMATS[2],
              });
            }
          }}
          value={displayFormat}
          width={300}
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

      {displayFormat?.value === POST_BODY_FORMAT_OPTIONS[2].value && (
        <Field
          name="actionConfiguration.body[2]"
          component="textarea"
          rows={10}
          style={{
            resize: "none",
            overflow: "auto",
            width: "95%",
            marginLeft: 5,
          }}
        />
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
  setDisplayFormat: (id: string, displayFormat: string) => {
    dispatch({
      type: ReduxActionTypes.SET_EXTRA_FORMDATA,
      payload: {
        id,
        values: {
          displayFormat,
        },
      },
    });
  },
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
    apiId,
  };
}, mapDispatchToProps)(PostBodyData);
