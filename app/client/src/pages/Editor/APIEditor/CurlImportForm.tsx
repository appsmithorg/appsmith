import React from "react";
import { reduxForm, InjectedFormProps, Form, Field } from "redux-form";
import { connect } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router";
import styled from "styled-components";
import { AppState } from "@appsmith/reducers";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { CURL_IMPORT_FORM } from "@appsmith/constants/forms";
import { BuilderRouteParams } from "constants/routes";
import { curlImportFormValues, curlImportSubmitHandler } from "./helpers";
import { createNewApiName } from "utils/AppsmithUtils";
import { Colors } from "constants/Colors";
import CurlLogo from "assets/images/Curl-logo.svg";
import CloseEditor from "components/editorComponents/CloseEditor";
import { Button, Size } from "design-system";
import FormRow from "components/editorComponents/FormRow";

const MainConfiguration = styled.div`
  padding: ${(props) => props.theme.spaces[7]}px
    ${(props) => props.theme.spaces[10]}px 0px
    ${(props) => props.theme.spaces[10]}px;
  ${FormRow} {
    align-items: flex-start;
  }
`;

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
  background-color: ${Colors.GREY_2};
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.theme.spaces[1]}px;
`;

const CurlImportText = styled.p`
  max-width: 100%;
  flex: 0 1 auto;
  font-size: ${(props) => props.theme.fontSizes[5]}px;
  font-weight: ${(props) => props.theme.fontWeights[1]};
  color: ${Colors.CODE_GRAY};
`;

const StyledForm = styled(Form)`
  flex: 1;
  overflow: auto;
  border-top: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  padding: ${(props) => props.theme.spaces[7]}px
    ${(props) => props.theme.spaces[10]}px 0px
    ${(props) => props.theme.spaces[10]}px;
  color: var(--appsmith-color-black-800);
  label {
    font-size: ${(props) => props.theme.fontSizes[4]}px;
    font-weight: ${(props) => props.theme.fontWeights[1]};
  }
`;

const CurlHintText = styled.div`
  font-size: ${(props) => props.theme.fontSizes[3]}px;
  font-weight: ${(props) => props.theme.fontWeights[1]};
  margin: ${(props) => props.theme.spaces[2]}px 0px
    ${(props) => props.theme.spaces[9]}px 0px;
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
    border: 1px solid ${Colors.GREY_5};
    font-size: ${(props) => props.theme.fontSizes[3]}px;
  }
`;

interface ReduxStateProps {
  actions: ActionDataState;
  initialValues: Record<string, unknown>;
  isImportingCurl: boolean;
}

export type StateAndRouteProps = ReduxStateProps &
  RouteComponentProps<BuilderRouteParams>;

type Props = StateAndRouteProps &
  InjectedFormProps<curlImportFormValues, StateAndRouteProps>;

class CurlImportForm extends React.Component<Props> {
  render() {
    const { handleSubmit, isImportingCurl } = this.props;
    return (
      <>
        <CloseEditor />
        <MainConfiguration>
          <FormRow className="form-row-header">
            <div
              style={{
                display: "flex",
              }}
            >
              <CurlIconWrapper>
                <img alt="CURL" src={CurlLogo} />
              </CurlIconWrapper>
              <CurlImportText className="text">Import from CURL</CurlImportText>
            </div>
            <ActionButtons className="t--formActionButtons">
              <Button
                className="t--importBtn"
                isLoading={isImportingCurl}
                onClick={handleSubmit(curlImportSubmitHandler)}
                size={Size.medium}
                tag="button"
                text="Import"
                type="button"
              />
            </ActionButtons>
          </FormRow>
        </MainConfiguration>
        <StyledForm onSubmit={handleSubmit(curlImportSubmitHandler)}>
          <label className="inputLabel">Paste CURL Code Here</label>
          <CurlHintText>
            Hint: Try typing in the following curl command and then click on the
            &apos;Import&apos; button: curl -X GET
            https://mock-api.appsmith.com/users
          </CurlHintText>
          <CurlImportFormContainer>
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
      </>
    );
  }
}

const mapStateToProps = (state: AppState, props: Props): ReduxStateProps => {
  const { pageId: destinationPageId } = props.match.params;

  if (destinationPageId) {
    return {
      actions: state.entities.actions,
      initialValues: {
        pageId: destinationPageId,
        name: createNewApiName(state.entities.actions, destinationPageId),
      },
      isImportingCurl: state.ui.imports.isImportingCurl,
    };
  }
  return {
    actions: state.entities.actions,
    initialValues: {},
    isImportingCurl: state.ui.imports.isImportingCurl,
  };
};

export default withRouter(
  connect(mapStateToProps)(
    reduxForm<curlImportFormValues, StateAndRouteProps>({
      form: CURL_IMPORT_FORM,
    })(CurlImportForm),
  ),
);
