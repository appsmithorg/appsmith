import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { formValueSelector } from "redux-form";
import { POST_BODY_FORMAT_OPTIONS } from "constants/ApiEditorConstants";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import FormLabel from "components/editorComponents/FormLabel";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";

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
  displayFormat: string;
  change: Function;
}
type Props = PostDataProps;

const PostBodyData = (props: Props) => {
  const { displayFormat } = props;

  return (
    <PostbodyContainer>
      <FormLabel>{"Post Body"}</FormLabel>
      <DropDownContainer>
        <DropdownField
          placeholder="Format"
          name="displayFormat"
          isSearchable={false}
          width={232}
          options={POST_BODY_FORMAT_OPTIONS}
        />
      </DropDownContainer>

      {displayFormat === POST_BODY_FORMAT_OPTIONS[0].value && (
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

      {displayFormat === POST_BODY_FORMAT_OPTIONS[1].value && (
        <React.Fragment>
          <KeyValueFieldArray name="actionConfiguration.body[1]" label="" />
        </React.Fragment>
      )}
    </PostbodyContainer>
  );
};

const selector = formValueSelector(API_EDITOR_FORM_NAME);
export default connect(state => {
  const displayFormat = selector(state, "displayFormat");
  const headers = selector(state, "actionConfiguration.headers");
  let contentType;
  if (headers) {
    contentType = headers.find((header: any) => header.key === "content-type");
  }

  return {
    displayFormat,
    contentType,
  };
})(PostBodyData);
