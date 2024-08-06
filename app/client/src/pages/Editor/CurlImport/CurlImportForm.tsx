import React from "react";
import type { InjectedFormProps } from "redux-form";
import { reduxForm, Form, Field } from "redux-form";
import styled from "styled-components";
import { CURL_IMPORT_FORM } from "ee/constants/forms";
import { type CurlImportFormValues, curlImportSubmitHandler } from "./helpers";

const StyledForm = styled(Form)`
  flex: 1;
  overflow: auto;
  color: var(--ads-v2-color-fg);
`;

const CurlHintText = styled.div`
  font-size: 12px;
  margin: 0 0 var(--ads-v2-spaces-4);
  color: var(--ads-v2-color-fg-muted);
`;

const CurlImportFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: flex-end;
  overflow: auto;

  .textAreaStyles {
    min-height: 50vh;
    max-height: 50vh;
    padding: ${(props) => props.theme.spaces[4]}px;
    min-width: 100%;
    max-width: 100%;
    overflow: auto;
    border: 1px solid var(--ads-v2-color-border);
    border-radius: var(--ads-v2-border-radius);
    font-size: ${(props) => props.theme.fontSizes[3]}px;
  }
`;

interface OwnProps {
  curlImportSubmitHandler: (
    values: CurlImportFormValues,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dispatch: any,
  ) => void;
  initialValues: Record<string, unknown>;
}

type Props = OwnProps & InjectedFormProps<CurlImportFormValues, OwnProps>;

class CurlImportForm extends React.Component<Props> {
  render() {
    const { handleSubmit } = this.props;

    return (
      <StyledForm onSubmit={handleSubmit(curlImportSubmitHandler)}>
        <label className="inputLabel">Paste CURL Code Here</label>
        <CurlHintText>
          Hint: Try typing in the following curl command and then click on the
          &apos;Import&apos; button: curl -X GET
          https://mock-api.appsmith.com/users
        </CurlHintText>
        <CurlImportFormContainer>
          {/*TODO: use ds text-area here? */}
          <Field
            autoFocus
            className="textAreaStyles"
            component="textarea"
            name="curl"
          />
          <Field component="input" name="contextType" type="hidden" />
        </CurlImportFormContainer>
      </StyledForm>
    );
  }
}

export default reduxForm<CurlImportFormValues, OwnProps>({
  form: CURL_IMPORT_FORM,
})(CurlImportForm);
