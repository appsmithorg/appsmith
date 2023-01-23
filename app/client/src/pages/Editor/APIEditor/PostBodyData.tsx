import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { formValueSelector } from "redux-form";
import {
  CONTENT_TYPE_HEADER_KEY,
  POST_BODY_FORMAT_OPTIONS,
  POST_BODY_FORMAT_TITLES,
} from "constants/ApiEditorConstants/CommonApiConstants";
import { API_EDITOR_FORM_NAME } from "@appsmith/constants/forms";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import { AppState } from "@appsmith/reducers";
import FIELD_VALUES from "constants/FieldExpectedValue";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import {
  Classes,
  MultiSwitch,
  Icon,
  IconSize,
  TooltipComponent,
} from "design-system-old";
import { updateBodyContentType } from "actions/apiPaneActions";
import { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";
import {
  createMessage,
  API_PANE_NO_BODY,
  API_PANE_INVALID_CONTENT_TYPE,
} from "@appsmith/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";

const PostBodyContainer = styled.div`
  padding: 12px 0px 0px;
  background-color: ${(props) => props.theme.colors.apiPane.tabBg};
  height: 100%;
`;

const JSONEditorFieldWrapper = styled.div`
  margin: 0 30px;
  width: 65%;
  .CodeMirror {
    height: auto;
    min-height: 250px;
  }
`;

const NoBodyMessage = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;

  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.apiPane.body.text};
  }
`;

const WarningWrapper = styled.div`
  position: absolute;
  top: 48px;
  left: 530px;
  display: flex;
  justify-content: center;
`;

interface PostDataProps {
  displayFormat: any;
  dataTreePath: string;
  theme?: EditorTheme;
  updateBodyContentType: (contentType: string, apiId: string) => void;
  apiId: string;
  isContentTypeValid: boolean;
}

type Props = PostDataProps;

const expectedPostBody: CodeEditorExpected = {
  type: FIELD_VALUES.API_ACTION.body,
  example: '{\n  "color":"blue",\n  "isVisible": true \n}',
  autocompleteDataType: AutocompleteDataType.OBJECT,
};

function PostBodyData(props: Props) {
  const {
    apiId,
    dataTreePath,
    displayFormat,
    isContentTypeValid,
    theme,
    updateBodyContentType,
  } = props;

  const tabComponentsMap = (key: string, contentType: string): JSX.Element => {
    return {
      [POST_BODY_FORMAT_OPTIONS.NONE]: (
        <NoBodyMessage id="NoBodyMessageDiv">
          {" "}
          {createMessage(API_PANE_NO_BODY)}{" "}
        </NoBodyMessage>
      ),
      [POST_BODY_FORMAT_OPTIONS.JSON]: (
        <JSONEditorFieldWrapper className={"t--apiFormPostBody"} key={key}>
          <DynamicTextField
            border={CodeEditorBorder.ALL_SIDE}
            dataTreePath={`${dataTreePath}.body`}
            expected={expectedPostBody}
            mode={EditorModes.JSON_WITH_BINDING}
            name="actionConfiguration.body"
            placeholder={`{{\n\t{name: inputName.property, preference: dropdownName.property}\n}}`}
            showLineNumbers
            size={EditorSize.EXTENDED}
            tabBehaviour={TabBehaviour.INDENT}
            theme={theme}
          />
        </JSONEditorFieldWrapper>
      ),
      [POST_BODY_FORMAT_OPTIONS.FORM_URLENCODED]: (
        <KeyValueFieldArray
          dataTreePath={`${dataTreePath}.bodyFormData`}
          key={key}
          label=""
          name="actionConfiguration.bodyFormData"
          pushFields
          theme={theme}
        />
      ),

      [POST_BODY_FORMAT_OPTIONS.MULTIPART_FORM_DATA]: (
        <KeyValueFieldArray
          dataTreePath={`${dataTreePath}.bodyFormData`}
          hasType
          key={key}
          label=""
          name="actionConfiguration.bodyFormData"
          pushFields
          theme={theme}
        />
      ),

      [POST_BODY_FORMAT_OPTIONS.RAW]: (
        <JSONEditorFieldWrapper key={key}>
          <DynamicTextField
            border={CodeEditorBorder.ALL_SIDE}
            dataTreePath={`${dataTreePath}.body`}
            mode={EditorModes.TEXT_WITH_BINDING}
            name="actionConfiguration.body"
            placeholder={`{{\n\t{name: inputName.property, preference: dropdownName.property}\n}}`}
            size={EditorSize.EXTENDED}
            tabBehaviour={TabBehaviour.INDENT}
            theme={theme}
          />
        </JSONEditorFieldWrapper>
      ),
    }[contentType];
  };

  return (
    <PostBodyContainer>
      <MultiSwitch
        cypressSelector="t--api-body-tab-switch"
        onSelect={(title: string) => updateBodyContentType(title, apiId)}
        selected={displayFormat}
        tabs={POST_BODY_FORMAT_TITLES.map((el) => {
          return {
            key: el.key,
            title: el.title,
            panelComponent: tabComponentsMap(el.key, el.key),
          };
        })}
      />
      {!isContentTypeValid && (
        <WarningWrapper>
          <TooltipComponent
            content={createMessage(API_PANE_INVALID_CONTENT_TYPE)}
            hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
            position="bottom-left"
          >
            <Icon
              fillColor="#ffb400"
              name="warning-line"
              size={IconSize.XXXL}
            />
          </TooltipComponent>
        </WarningWrapper>
      )}
    </PostBodyContainer>
  );
}

const selector = formValueSelector(API_EDITOR_FORM_NAME);

const mapDispatchToProps = (dispatch: any) => ({
  updateBodyContentType: (contentType: string, apiId: string) =>
    dispatch(updateBodyContentType(contentType, apiId)),
});

export default connect((state: AppState) => {
  const apiId = selector(state, "id");
  const headers = selector(state, "actionConfiguration.headers") || [];
  const extraFormData = state.ui.apiPane.extraformData[apiId] || {};
  // Defaults to NONE when extraformData is empty
  const displayFormat = extraFormData["displayFormat"] || {
    label: POST_BODY_FORMAT_OPTIONS.NONE,
    value: POST_BODY_FORMAT_OPTIONS.NONE,
  };

  let isContentTypeValid = true;
  headers.map((header: { key: string; value: string }) => {
    if (header?.key && header?.key === CONTENT_TYPE_HEADER_KEY) {
      if (
        header?.value &&
        header?.value !== displayFormat?.value &&
        displayFormat?.value !== POST_BODY_FORMAT_OPTIONS.NONE &&
        displayFormat?.value !== POST_BODY_FORMAT_OPTIONS.RAW
      ) {
        isContentTypeValid = false;
      } else {
        isContentTypeValid = true;
      }
    }
  });

  return {
    displayFormat,
    apiId,
    isContentTypeValid,
  };
}, mapDispatchToProps)(PostBodyData);
