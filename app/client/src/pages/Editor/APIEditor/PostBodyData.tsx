import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { change, formValueSelector } from "redux-form";
import {
  CONTENT_TYPE,
  POST_BODY_FORMAT_OPTIONS,
  POST_BODY_FORMAT_TITLES_NO_MULTI_PART,
  POST_BODY_FORMATS,
} from "constants/ApiEditorConstants";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import { AppState } from "reducers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import FIELD_VALUES from "constants/FieldExpectedValue";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import MultiSwitch from "components/ads/MultiSwitch";
import { BodyFormData } from "entities/Action";

const PostBodyContainer = styled.div`
  padding: 12px 0px 0px;
  background-color: ${(props) => props.theme.colors.apiPane.bg};
  height: 100%;
`;

const JSONEditorFieldWrapper = styled.div`
  margin: 0 30px;
  .CodeMirror {
    height: auto;
    min-height: 250px;
  }
`;

interface PostDataProps {
  actionConfiguration: any;
  displayFormat: any;
  actionConfigurationHeaders?: any;
  change: any;
  onDisplayFormatChange: (headers: any[]) => void;
  apiId: string;
  setDisplayFormat: (
    apiId: string,
    displayFormat: { label: string; value: string },
  ) => void;
  dataTreePath: string;
  theme?: EditorTheme;
  bodyFormData?: BodyFormData[];
  addBodyFormData: () => void;
}

type Props = PostDataProps;

const PostBodyData = (props: Props) => {
  const {
    onDisplayFormatChange,
    actionConfigurationHeaders,
    displayFormat,
    setDisplayFormat,
    apiId,
    dataTreePath,
    bodyFormData,
    addBodyFormData,
  } = props;

  return (
    <PostBodyContainer>
      <MultiSwitch
        selected={displayFormat}
        tabs={POST_BODY_FORMAT_TITLES_NO_MULTI_PART.map((el) => {
          let component = (
            <JSONEditorFieldWrapper
              className={"t--apiFormPostBody"}
              key={el.key}
            >
              <DynamicTextField
                name="actionConfiguration.body"
                expected={FIELD_VALUES.API_ACTION.body}
                showLineNumbers
                tabBehaviour={TabBehaviour.INDENT}
                size={EditorSize.EXTENDED}
                mode={EditorModes.JSON_WITH_BINDING}
                placeholder={
                  '{\n  "name":"{{ inputName.property }}",\n  "preference":"{{ dropdownName.property }}"\n}\n\n\\\\Take widget inputs using {{ }}'
                }
                dataTreePath={`${dataTreePath}.body`}
                theme={props.theme}
              />
            </JSONEditorFieldWrapper>
          );
          if (el.key === POST_BODY_FORMAT_OPTIONS[1].value) {
            component = (
              <KeyValueFieldArray
                key={el.key}
                name="actionConfiguration.bodyFormData"
                dataTreePath={`${dataTreePath}.bodyFormData`}
                label=""
                theme={props.theme}
              />
            );
          } else if (el.key === POST_BODY_FORMAT_OPTIONS[3].value) {
            component = (
              <JSONEditorFieldWrapper key={el.key}>
                <DynamicTextField
                  name="actionConfiguration.body"
                  tabBehaviour={TabBehaviour.INDENT}
                  size={EditorSize.EXTENDED}
                  mode={EditorModes.TEXT_WITH_BINDING}
                  dataTreePath={`${dataTreePath}.body`}
                  theme={props.theme}
                />
              </JSONEditorFieldWrapper>
            );
          }
          return { key: el.key, title: el.title, panelComponent: component };
        })}
        onSelect={(title?: string) => {
          const displayFormatObject = POST_BODY_FORMAT_OPTIONS.filter(
            (el) => el.label === title,
          )[0];
          if (
            displayFormatObject &&
            displayFormatObject.value === POST_BODY_FORMATS[3]
          ) {
            // Dont update the content type header if raw has been selected
            setDisplayFormat(apiId, POST_BODY_FORMAT_OPTIONS[3]);
            return;
          }

          const contentTypeHeaderIndex = actionConfigurationHeaders.findIndex(
            (element: { key: string; value: string }) =>
              element &&
              element.key &&
              element.key.trim().toLowerCase() === CONTENT_TYPE,
          );

          // If there is an existing header with content type, use that or
          // create a new header
          const indexToUpdate =
            contentTypeHeaderIndex > -1
              ? contentTypeHeaderIndex
              : actionConfigurationHeaders.length;

          const updatedHeaders = [...actionConfigurationHeaders];

          updatedHeaders[indexToUpdate] = {
            key: CONTENT_TYPE,
            value: displayFormatObject.value,
          };

          onDisplayFormatChange(updatedHeaders);
          if (
            displayFormatObject &&
            displayFormatObject.value === POST_BODY_FORMATS[1]
          ) {
            if (!bodyFormData) {
              addBodyFormData();
            }
          }
        }}
      />

      {/* Commenting this till we figure the code to create a multipart request
      {displayFormat?.value === POST_BODY_FORMAT_OPTIONS[2].value && (
        <React.Fragment>
          <KeyValueFieldArray name="actionConfiguration.bodyFormData" label="" />
        </React.Fragment>
      )} */}
    </PostBodyContainer>
  );
};

const selector = formValueSelector(API_EDITOR_FORM_NAME);

const mapDispatchToProps = (dispatch: any) => ({
  onDisplayFormatChange: (value: any[]) =>
    dispatch(
      change(API_EDITOR_FORM_NAME, "actionConfiguration.headers", value),
    ),
  addBodyFormData: () =>
    dispatch(
      change(API_EDITOR_FORM_NAME, "actionConfiguration.bodyFormData", [
        { key: "", value: "" },
        { key: "", value: "" },
      ]),
    ),
  setDisplayFormat: (
    id: string,
    displayFormat: { label: string; value: string },
  ) => {
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
  const bodyFormData = selector(state, "actionConfiguration.bodyFormData");
  let contentType;
  if (headers) {
    contentType = headers.find(
      (header: any) =>
        header && header.key && header.key.toLowerCase() === CONTENT_TYPE,
    );
  }

  return {
    displayFormat:
      extraFormData["displayFormat"] || POST_BODY_FORMAT_OPTIONS[3],
    contentType,
    apiId,
    bodyFormData,
  };
}, mapDispatchToProps)(PostBodyData);
