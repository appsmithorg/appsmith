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
                pushFields
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
            setDisplayFormat(apiId, POST_BODY_FORMAT_OPTIONS[3]);
            return;
          }

          const elementsIndex = actionConfigurationHeaders.findIndex(
            (element: { key: string; value: string }) =>
              element &&
              element.key &&
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
  };
}, mapDispatchToProps)(PostBodyData);
