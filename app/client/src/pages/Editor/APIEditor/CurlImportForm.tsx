import React from "react";
import type { InjectedFormProps } from "redux-form";
import { reduxForm, Form, Field } from "redux-form";
import { connect } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { withRouter } from "react-router";
import styled from "styled-components";
import type { AppState } from "@appsmith/reducers";
import type { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { CURL_IMPORT_FORM } from "@appsmith/constants/forms";
import type { BuilderRouteParams } from "constants/routes";
import type { curlImportFormValues } from "./helpers";
import { curlImportSubmitHandler } from "./helpers";
import { createNewApiName } from "utils/AppsmithUtils";
import CurlLogo from "assets/images/Curl-logo.svg";
import CloseEditor from "components/editorComponents/CloseEditor";
import { Button } from "design-system";
import FormRow from "components/editorComponents/FormRow";
import Debugger, {
  ResizerContentContainer,
  ResizerMainContainer,
} from "../DataSourceEditor/Debugger";
import { showDebuggerFlag } from "selectors/debuggerSelectors";

const MainConfiguration = styled.div`
  padding: var(--ads-v2-spaces-4) var(--ads-v2-spaces-7);
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
  font-size: 17px;
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
const MainContainer = styled.div`
  display: flex;
  position: relative;
  height: 100%;
  flex-direction: column;
  /* padding: var(--ads-v2-spaces-7); */
  .curl-form-resizer-content {
    padding: 0px var(--ads-v2-spaces-7);
  }
`;
interface ReduxStateProps {
  actions: ActionDataState;
  initialValues: Record<string, unknown>;
  isImportingCurl: boolean;
  showDebugger: boolean;
}

export type StateAndRouteProps = ReduxStateProps &
  RouteComponentProps<BuilderRouteParams>;

type Props = StateAndRouteProps &
  InjectedFormProps<curlImportFormValues, StateAndRouteProps>;

class CurlImportForm extends React.Component<Props> {
  render() {
    const { handleSubmit, isImportingCurl, showDebugger } = this.props;
    return (
      <MainContainer>
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
                size="md"
              >
                Import
              </Button>
            </ActionButtons>
          </FormRow>
        </MainConfiguration>
        <ResizerMainContainer>
          <ResizerContentContainer className="curl-form-resizer-content">
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
          </ResizerContentContainer>
          {showDebugger && <Debugger />}
        </ResizerMainContainer>
      </MainContainer>
    );
  }
}

const mapStateToProps = (state: AppState, props: Props): ReduxStateProps => {
  const { pageId: destinationPageId } = props.match.params;

  // Debugger render flag
  const showDebugger = showDebuggerFlag(state);

  if (destinationPageId) {
    return {
      actions: state.entities.actions,
      initialValues: {
        pageId: destinationPageId,
        name: createNewApiName(state.entities.actions, destinationPageId),
      },
      isImportingCurl: state.ui.imports.isImportingCurl,
      showDebugger,
    };
  }
  return {
    actions: state.entities.actions,
    initialValues: {},
    isImportingCurl: state.ui.imports.isImportingCurl,
    showDebugger,
  };
};

export default withRouter(
  connect(mapStateToProps)(
    reduxForm<curlImportFormValues, StateAndRouteProps>({
      form: CURL_IMPORT_FORM,
    })(CurlImportForm),
  ),
);
