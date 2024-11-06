import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import {
  POST_BODY_FORMAT_OPTIONS,
  POST_BODY_FORMAT_TITLES,
} from "../../../../constants/CommonApiConstants";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import FIELD_VALUES from "constants/FieldExpectedValue";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { Classes } from "@appsmith/ads-old";
import {
  getPostBodyFormat,
  updatePostBodyContentType,
} from "../../../../store";
import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import { createMessage, API_PANE_NO_BODY } from "ee/constants/messages";
import { Select, Option } from "@appsmith/ads";

const PostBodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: var(--ads-v2-color-bg);
  height: 100%;
  gap: var(--ads-v2-spaces-4);
  .ads-v2-select {
    max-width: 250px;
    width: 100%;
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
  dataTreePath: string;
  theme?: EditorTheme;
}

type Props = PostDataProps;

const expectedPostBody: CodeEditorExpected = {
  type: FIELD_VALUES.API_ACTION.body,
  example: '{\n  "color":"blue",\n  "isVisible": true \n}',
  autocompleteDataType: AutocompleteDataType.OBJECT,
};

function PostBodyData(props: Props) {
  const postBodyFormat = useSelector(getPostBodyFormat);
  const dispatch = useDispatch();

  const updateBodyContentType = useCallback((tab: string) => {
    dispatch(updatePostBodyContentType(tab));
  }, []);

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

  return (
    <PostBodyContainer>
      <Select
        data-testid="t--api-body-tab-switch"
        defaultValue={postBodyFormat.value}
        onSelect={updateBodyContentType}
        value={postBodyFormat.value}
      >
        {options.map((option) => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
      {tabComponentsMap(postBodyFormat.value)}
    </PostBodyContainer>
  );
}

export default PostBodyData;
