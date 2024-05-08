import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { formValueSelector } from "redux-form";
import {
  POST_BODY_FORMAT_OPTIONS,
  POST_BODY_FORMAT_TITLES,
} from "constants/ApiEditorConstants/CommonApiConstants";
import { API_EDITOR_FORM_NAME } from "@appsmith/constants/forms";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import type { AppState } from "@appsmith/reducers";
import FIELD_VALUES from "constants/FieldExpectedValue";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { Classes } from "design-system-old";
import { updateBodyContentType } from "actions/apiPaneActions";
import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import { createMessage, API_PANE_NO_BODY } from "@appsmith/constants/messages";
import { SegmentedControl } from "design-system";

const PostBodyContainer = styled.div`
  padding: 12px 0px 0px;
  background-color: var(--ads-v2-color-bg);
  height: 100%;
  .ads-v2-segmented-control {
    /* max-width: fit-content;
    margin-left: 30px; */
    margin-bottom: 12px;
  }
`;

const JSONEditorFieldWrapper = styled.div`
  /* margin: 0 30px;
  width: 65%; */
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
    color: var(--ads-v2-color-fg);
  }
`;

interface PostDataProps {
  displayFormat: { label: string; value: string };
  dataTreePath: string;
  theme?: EditorTheme;
  apiId: string;
  updateBodyContentType: (contentType: string, apiId: string) => void;
}

type Props = PostDataProps;

const expectedPostBody: CodeEditorExpected = {
  type: FIELD_VALUES.API_ACTION.body,
  example: '{\n  "color":"blue",\n  "isVisible": true \n}',
  autocompleteDataType: AutocompleteDataType.OBJECT,
};

function PostBodyData(props: Props) {
  const [selectedTab, setSelectedTab] = React.useState(
    props.displayFormat?.value,
  );
  const { dataTreePath, theme } = props;

  const tabComponentsMap = (key: string) => {
    switch (key) {
      case POST_BODY_FORMAT_OPTIONS.NONE:
        return (
          <NoBodyMessage id="NoBodyMessageDiv">
            {createMessage(API_PANE_NO_BODY)}
          </NoBodyMessage>
        );
      case POST_BODY_FORMAT_OPTIONS.JSON:
        return (
          <JSONEditorFieldWrapper className={"t--apiFormPostBody"} key={key}>
            <DynamicTextField
              border={CodeEditorBorder.ALL_SIDE}
              dataTreePath={`${dataTreePath}.body`}
              evaluatedPopUpLabel={"Body"}
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
        );
      case POST_BODY_FORMAT_OPTIONS.FORM_URLENCODED:
        return (
          <KeyValueFieldArray
            dataTreePath={`${dataTreePath}.bodyFormData`}
            key={key}
            label=""
            name="actionConfiguration.bodyFormData"
            pushFields
            theme={theme}
          />
        );
      case POST_BODY_FORMAT_OPTIONS.MULTIPART_FORM_DATA:
        return (
          <KeyValueFieldArray
            dataTreePath={`${dataTreePath}.bodyFormData`}
            hasType
            key={key}
            label=""
            name="actionConfiguration.bodyFormData"
            pushFields
            theme={theme}
          />
        );
      case POST_BODY_FORMAT_OPTIONS.RAW:
        return (
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
        );
      // This format is particularly used for uploading files, in this case
      // From filepicker we can take base64 string and pass it to server
      // which then decodes it and uploads the file to given URL
      case POST_BODY_FORMAT_OPTIONS.BINARY:
        return (
          <JSONEditorFieldWrapper key={key}>
            <DynamicTextField
              border={CodeEditorBorder.ALL_SIDE}
              dataTreePath={`${dataTreePath}.body`}
              mode={EditorModes.TEXT_WITH_BINDING}
              name="actionConfiguration.body"
              placeholder={`{{\n\t// Make sure to select the 'Base64' in the Data Format property of the Filepicker widget as the file contents are expected to be in Base64 format\n\tfilePickerName.files[0].data\n}}`}
              size={EditorSize.EXTENDED}
              tabBehaviour={TabBehaviour.INDENT}
              theme={theme}
            />
          </JSONEditorFieldWrapper>
        );
    }
  };

  const options = POST_BODY_FORMAT_TITLES.map((el) => ({
    label: el.title,
    value: el.key,
  }));

  const postBodyDataOnChangeFn = (key: string) => {
    setSelectedTab(key);
    props?.updateBodyContentType(key, props.apiId);
  };

  return (
    <PostBodyContainer>
      <SegmentedControl
        data-testid="t--api-body-tab-switch"
        defaultValue={selectedTab}
        isFullWidth={false}
        onChange={(key: string) => postBodyDataOnChangeFn(key)}
        options={options}
      />
      {tabComponentsMap(selectedTab)}
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
  const extraFormData = state.ui.apiPane.extraformData[apiId] || {};
  // Defaults to NONE when extraformData is empty
  const displayFormat = extraFormData["displayFormat"] || {
    label: POST_BODY_FORMAT_OPTIONS.NONE,
    value: POST_BODY_FORMAT_OPTIONS.NONE,
  };

  return {
    displayFormat,
    apiId,
  };
}, mapDispatchToProps)(PostBodyData);
