import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { formValueSelector, change } from "redux-form";
import Select from "react-select";
import {
  POST_BODY_FORMAT_OPTIONS,
  POST_BODY_FORMATS,
  CONTENT_TYPE,
  POST_BODY_FORMAT_OPTIONS_NO_MULTI_PART,
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
      <FormLabel>{"Body"}</FormLabel>
      <DropDownContainer>
        <Select
          className={"t--apiFormPostBodyType"}
          defaultValue={POST_BODY_FORMAT_OPTIONS[0]}
          placeholder="Format"
          isSearchable={false}
          onChange={(displayFormatObject: any) => {
            if (
              displayFormatObject &&
              displayFormatObject.value === POST_BODY_FORMATS[3]
            ) {
              setDisplayFormat(apiId, POST_BODY_FORMAT_OPTIONS[3]);
              return;
            }

            const elementsIndex = actionConfigurationHeaders.findIndex(
              (element: { key: string; value: string }) =>
                element.key.trim().toLowerCase() === CONTENT_TYPE,
            );

            if (elementsIndex >= 0 && displayFormatObject) {
              const updatedHeaders = [...actionConfigurationHeaders];

              updatedHeaders[elementsIndex] = {
                ...updatedHeaders[elementsIndex],
                key: CONTENT_TYPE,
                value: displayFormatObject.value,
              };

              onDisplayFormatChange(updatedHeaders);
            } else {
              setDisplayFormat(apiId, POST_BODY_FORMAT_OPTIONS[3]);
            }
          }}
          value={displayFormat}
          width={300}
          options={POST_BODY_FORMAT_OPTIONS_NO_MULTI_PART}
        />
      </DropDownContainer>

      {displayFormat?.value === POST_BODY_FORMAT_OPTIONS[0].value && (
        <React.Fragment>
          <JSONEditorFieldWrapper className={"t--apiFormPostBody"}>
            <DynamicTextField
              name="actionConfiguration.body"
              height={300}
              showLineNumbers
              allowTabIndent
              singleLine={false}
              placeholder={
                'Please enter this request\'s JSON body.\n\n\nDid you know?\n\tIn Appsmith, we can use a widget\'s or API\'s property dynamically, using {{ }} templates.\n\n\tFor example: If we have an input widget named Input1 in which the user would provide their name \n\tand this body structure should be { "name": "<text from Input1>" } \n\tWe can access it in this body using { "name": "{{Input1.text}}" }'
              }
            />
          </JSONEditorFieldWrapper>
        </React.Fragment>
      )}

      {displayFormat?.value === POST_BODY_FORMAT_OPTIONS[1].value && (
        <React.Fragment>
          <KeyValueFieldArray
            name="actionConfiguration.bodyFormData"
            label=""
          />
        </React.Fragment>
      )}

      {/* Commenting this till we figure the code to create a multipart request
      {displayFormat?.value === POST_BODY_FORMAT_OPTIONS[2].value && (
        <React.Fragment>
          <KeyValueFieldArray name="actionConfiguration.bodyFormData" label="" />
        </React.Fragment>
      )} */}

      {displayFormat?.value === POST_BODY_FORMAT_OPTIONS[3].value && (
        <React.Fragment>
          <JSONEditorFieldWrapper>
            <DynamicTextField
              name="actionConfiguration.body"
              height={300}
              allowTabIndent
              singleLine={false}
            />
          </JSONEditorFieldWrapper>
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
    contentType = headers.find(
      (header: any) => header.key.toLowerCase() === CONTENT_TYPE,
    );
  }

  return {
    displayFormat:
      extraFormData["displayFormat"] || POST_BODY_FORMAT_OPTIONS[3],
    contentType,
    apiId,
  };
}, mapDispatchToProps)(PostBodyData);
