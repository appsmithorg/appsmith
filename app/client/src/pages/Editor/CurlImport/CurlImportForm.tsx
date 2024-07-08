import React from "react";
import type { InjectedFormProps } from "redux-form";
import { reduxForm, Form, Field } from "redux-form";
import styled from "styled-components";
import { CURL_IMPORT_FORM } from "@appsmith/constants/forms";
import CurlLogo from "assets/images/Curl-logo.svg";
import {
  Button,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "design-system";
import { type curlImportFormValues, curlImportSubmitHandler } from "./helpers";

const ActionButtons = styled.div`
  justify-self: flex-end;
  display: flex;
  align-items: center;

  button:last-child {
    margin-left: ${(props) => props.theme.spaces[7]}px;
  }
`;

const CurlIconWrapper = styled.div`
  width: 24px;
  height: 24px;
  margin-right: ${(props) => props.theme.spaces[3]}px;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.theme.spaces[1]}px;
`;

const CurlImportText = styled.p`
  max-width: 100%;
  flex: 0 1 auto;
  font-size: 17px;
  font-weight: 500;
  color: var(--ads-v2-color-fg);
  line-height: 22px;
  letter-spacing: -0.204px;
`;

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
  isImportingCurl: boolean;
  curlImportSubmitHandler: (
    values: curlImportFormValues,
    dispatch: any,
  ) => void;
  initialValues: Record<string, unknown>;
}

type Props = OwnProps & InjectedFormProps<curlImportFormValues, OwnProps>;

class CurlImportForm extends React.Component<Props> {
  render() {
    const { handleSubmit, isImportingCurl } = this.props;

    return (
      <Modal open>
        <ModalContent>
          <ModalHeader>
            <CurlIconWrapper>
              <img alt="CURL" src={CurlLogo} />
            </CurlIconWrapper>
            <CurlImportText className="text">Import from CURL</CurlImportText>
          </ModalHeader>

          <div className="curl-form-resizer-content">
            <StyledForm onSubmit={handleSubmit(curlImportSubmitHandler)}>
              <label className="inputLabel">Paste CURL Code Here</label>
              <CurlHintText>
                Hint: Try typing in the following curl command and then click on
                the &apos;Import&apos; button: curl -X GET
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
                <Field component="input" name="pageId" type="hidden" />
                <Field component="input" name="name" type="hidden" />
              </CurlImportFormContainer>
            </StyledForm>
          </div>
          <ModalFooter>
            <ActionButtons className="t--formActionButtons">
              <Button
                className="t--importBtn"
                isLoading={isImportingCurl}
                onClick={handleSubmit(curlImportSubmitHandler)}
                size="md"
              >
                Import
              </Button>
            </ActionButtons>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
}

export default reduxForm<curlImportFormValues, OwnProps>({
  form: CURL_IMPORT_FORM,
})(CurlImportForm);
