import React from "react";
import { reduxForm, InjectedFormProps, Form, Field } from "redux-form";
import { connect } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router";
import styled from "styled-components";
import { AppState } from "reducers";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { CURL_IMPORT_FORM } from "constants/forms";
import { BuilderRouteParams } from "constants/routes";
import { curlImportFormValues, curlImportSubmitHandler } from "./helpers";
import { createNewApiName } from "utils/AppsmithUtils";
import { Colors } from "constants/Colors";
import Button from "components/editorComponents/Button";
import CurlLogo from "assets/images/Curl-logo.svg";
import CloseEditor from "../../../components/editorComponents/CloseEditor";

const StyledForm = styled(Form)`
  flex: 1;
  overflow: auto;
`;

const CurlImportFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: flex-end;
  margin-top: 8px;
  overflow: auto;

  .textAreaStyles {
    margin-bottom: 20px;
    min-height: 50vh;
    max-height: 50vh;
    padding: 10px;
    min-width: 100%;
    max-width: 100%;
    overflow: auto;
    border-radius: 4px;
    border: 1px solid ${Colors.GEYSER};
    font-size: 14px;
    line-height: 20px;
  }

  .importBtn {
    width: 111px;
    margin-right: 21px;
    margin-top: 10px;
  }
`;

const CurlImport = styled.div`
  font-size: 20px;
  padding: 20px;

  .backBtn {
    padding-bottom: 3px;
    cursor: pointer;
  }
  .backBtnText {
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
  }
`;

const CurlContainer = styled.div`
  margin-top: 20px;
  padding-left: 70px;
  padding-right: 70px;

  .inputLabel {
    font-weight: 500;
    font-size: 14px;
    color: ${Colors.BLUE_BAYOUX};
  }
`;

const DividerLine = styled.div`
  border: 1px solid ${Colors.CONCRETE};
`;

const Header = styled.div`
  .header {
    font-weight: 500;
    font-size: 24px;
    line-height: 32px;
    padding-left: 20px;
    padding-top: 10px;
  }
  .curlImage {
    float: left;
    margin-top: -5px;
    padding-right: 10px;
  }
  .divider {
    border: 1px solid ${Colors.CONCRETE};
  }
  .closeBtn {
    position: absolute;
    left: 70%;
  }
`;

const CurlLabel = styled.div`
  font-size: 12px;
  color: ${Colors.SLATE_GRAY};
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
        <Header>
          <p className="header">
            <img alt="CURL" className="curlImage" src={CurlLogo} />
            Import from CURL
          </p>
          <hr className="divider" />
        </Header>
        <StyledForm onSubmit={handleSubmit(curlImportSubmitHandler)}>
          <CurlImport>
            <CurlContainer>
              <label className="inputLabel">{"Paste CURL Code Here"}</label>
              <CurlLabel>
                {
                  "Hint: Try typing in the following curl command and then click on the 'Import' button: curl -X GET https://mock-api.appsmith.com/users"
                }
              </CurlLabel>
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
            </CurlContainer>
          </CurlImport>
          <DividerLine />
          <CurlImportFormContainer>
            <Button
              className="importBtn t--importBtn"
              filled
              intent="primary"
              loading={isImportingCurl}
              onClick={handleSubmit(curlImportSubmitHandler)}
              size="small"
              text="Import"
            />
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
