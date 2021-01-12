import React, { useMemo, useState } from "react";
import { connect, useSelector } from "react-redux";
import { reduxForm, InjectedFormProps, formValueSelector } from "redux-form";
import {
  HTTP_METHOD_OPTIONS,
  HTTP_METHODS,
} from "constants/ApiEditorConstants";
import styled from "styled-components";
import FormLabel from "components/editorComponents/FormLabel";
import FormRow from "components/editorComponents/FormRow";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import { PaginationField } from "api/ActionAPI";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import Pagination from "./Pagination";
import { PaginationType, RestAction } from "entities/Action";
import { Icon as BlueprintIcon } from "@blueprintjs/core";
import { HelpMap, HelpBaseURL } from "constants/HelpConstants";
import CollapsibleHelp from "components/designSystems/appsmith/help/CollapsibleHelp";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import PostBodyData from "./PostBodyData";
import ApiResponseView from "components/editorComponents/ApiResponseView";
import EmbeddedDatasourcePathField from "components/editorComponents/form/fields/EmbeddedDatasourcePathField";
import { AppState } from "reducers";
import { getApiName } from "selectors/formSelectors";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import ActionSettings from "pages/Editor/ActionSettings";
import { apiActionSettingsConfig } from "mockResponses/ActionSettings";
import RequestDropdownField from "components/editorComponents/form/fields/RequestDropdownField";
import { ExplorerURLParams } from "../Explorer/helpers";
import { EntityClassNames } from "../Explorer/Entity";
import MoreActionsMenu from "../Explorer/Actions/MoreActionsMenu";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { BUILDER_PAGE_URL } from "constants/routes";
import Icon, { IconSize } from "components/ads/Icon";
import Button, { Size } from "components/ads/Button";
import { TabComponent } from "components/ads/Tabs";
import { getThemeDetails } from "selectors/themeSelectors";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  height: calc(100vh - ${(props) => props.theme.headerHeight});
  overflow: hidden;
  width: 100%;
  ${FormLabel} {
    padding: ${(props) => props.theme.spaces[3]}px;
  }
  ${FormRow} {
    padding: ${(props) => props.theme.spaces[2]}px;
    & > * {
      /* margin-right: 10px; */
    }
    ${FormLabel} {
      padding: 0;
      width: 100%;
    }
  }
  .api-info-row {
    input {
      margin-left: ${(props) => props.theme.spaces[1] + 1}px;
    }
  }
`;

const MainConfiguration = styled.div`
  padding: ${(props) => props.theme.spaces[8]}px
    ${(props) => props.theme.spaces[12]}px 0px
    ${(props) => props.theme.spaces[12]}px;
  background-color: ${(props) => props.theme.colors.apiPane.bg};
  height: 126px;

  .close-modal-icon {
    cursor: pointer;
    svg {
      margin-right: 16px;
      width: 12px;
      height: 12px;
      path {
        fill: ${(props) => props.theme.colors.apiPane.closeIcon};
      }
    }
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

const ActionButton = styled(BaseButton)`
  &&& {
    max-width: 72px;
    &:last-of-type {
      margin-left: 16px;
    }
    min-height: 32px;
  }
`;

const DatasourceWrapper = styled.div`
  width: 100%;
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 126px);
`;

const TabbedViewContainer = styled.div`
  border-top: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  height: 50%;
  ${FormRow} {
    min-height: auto;
    padding: ${(props) => props.theme.spaces[0]}px;
    & > * {
      margin-right: 0px;
    }
  }

  &&& {
    ul.react-tabs__tab-list {
      padding: 0px ${(props) => props.theme.spaces[12]}px;
      background-color: ${(props) =>
        props.theme.colors.apiPane.responseBody.bg};
    }
    .react-tabs__tab-panel {
      height: calc(100% - 25px);
    }
  }
`;

export const BindingText = styled.span`
  color: ${(props) => props.theme.colors.bindingTextDark};
  font-weight: 700;
`;

const StyledOpenDocsIcon = styled(BlueprintIcon)`
  svg {
    width: 12px;
    height: 18px;
  }
`;
const RequestParamsWrapper = styled.div`
  flex: 4;
  border-right: 1px solid #d0d7dd;
  height: 100%;
  overflow-y: auto;
  padding-top: 6px;
  padding-left: 17px;
  padding-right: 10px;
`;

const SettingsWrapper = styled.div`
  padding-left: 15px;
  ${FormLabel} {
    padding: 0px;
  }
`;

const TabSection = styled.div`
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[14]}px
    ${(props) => props.theme.spaces[11] + 1}px
    ${(props) => props.theme.spaces[9]}px;
  background-color: ${(props) => props.theme.colors.apiPane.bg};
  height: 100%;
  overflow: auto;
`;

interface APIFormProps {
  pluginId: string;
  onRunClick: (paginationField?: PaginationField) => void;
  onDeleteClick: () => void;
  isRunning: boolean;
  isDeleting: boolean;
  paginationType: PaginationType;
  appName: string;
  httpMethodFromForm: string;
  actionConfigurationBody: Record<string, unknown> | string;
  actionConfigurationHeaders?: any;
  actionName: string;
  apiId: string;
  apiName: string;
}

type Props = APIFormProps & InjectedFormProps<RestAction, APIFormProps>;

export const NameWrapper = styled.div`
  width: 49%;
  display: flex;
  align-items: center;
  input {
    margin: 0;
    box-sizing: border-box;
  }
`;

const ApiEditorForm: React.FC<Props> = (props: Props) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const themeMode = useSelector(getThemeDetails).mode;
  const theme = useMemo(() => {
    if (themeMode === "LIGHT") {
      return EditorTheme.LIGHT;
    } else {
      return EditorTheme.DARK;
    }
  }, [themeMode]);

  const {
    pluginId,
    onDeleteClick,
    onRunClick,
    handleSubmit,
    isDeleting,
    isRunning,
    actionConfigurationHeaders,
    actionConfigurationBody,
    httpMethodFromForm,
    actionName,
  } = props;
  const allowPostBody =
    httpMethodFromForm && httpMethodFromForm !== HTTP_METHODS[0];

  const params = useParams<{ apiId?: string; queryId?: string }>();

  const actions: RestAction[] = useSelector((state: AppState) =>
    state.entities.actions.map((action) => action.config),
  );
  const currentActionConfig: RestAction | undefined = actions.find(
    (action) => action.id === params.apiId || action.id === params.queryId,
  );
  const history = useHistory();
  const location = useLocation();
  const { applicationId, pageId } = useParams<ExplorerURLParams>();

  const handleClose = (e: React.MouseEvent) => {
    PerformanceTracker.startTracking(
      PerformanceTransactionName.CLOSE_SIDE_PANE,
      { path: location.pathname },
    );
    e.stopPropagation();
    history.replace(BUILDER_PAGE_URL(applicationId, pageId));
  };

  return (
    <Form onSubmit={handleSubmit}>
      <MainConfiguration>
        <FormRow className="form-row-header">
          <NameWrapper className="t--nameOfApi">
            <Icon
              name="close-modal"
              size={IconSize.LARGE}
              className="close-modal-icon"
              onClick={handleClose}
            />
            <ActionNameEditor page="API_PANE" />
          </NameWrapper>
          <ActionButtons className="t--formActionButtons">
            <MoreActionsMenu
              id={currentActionConfig ? currentActionConfig.id : ""}
              name={currentActionConfig ? currentActionConfig.name : ""}
              className={EntityClassNames.CONTEXT_MENU}
              pageId={pageId}
            />
            <Button
              text="Run"
              tag="button"
              size={Size.medium}
              onClick={() => {
                onRunClick();
              }}
              isLoading={isRunning}
              className="t--apiFormRunBtn"
            />
          </ActionButtons>
        </FormRow>
        <FormRow className="api-info-row">
          <RequestDropdownField
            placeholder="Method"
            name="actionConfiguration.httpMethod"
            className="t--apiFormHttpMethod"
            options={HTTP_METHOD_OPTIONS}
            isSearchable={false}
          />
          <DatasourceWrapper className="t--dataSourceField">
            <EmbeddedDatasourcePathField
              name="actionConfiguration.path"
              pluginId={pluginId}
              placeholder="https://mock-api.appsmith.com/users"
            />
          </DatasourceWrapper>
        </FormRow>
      </MainConfiguration>
      <SecondaryWrapper>
        <TabbedViewContainer>
          <TabComponent
            tabs={[
              {
                key: "headers",
                title: "Headers",
                panelComponent: (
                  <TabSection>
                    {/* <CollapsibleHelp>
                      <span>{`Having trouble taking inputs from widget?`}</span>
                      <a
                        href={`${HelpBaseURL}${HelpMap["API_BINDING"].path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {" Learn How "}
                        <StyledOpenDocsIcon icon="document-open" />
                      </a>
                    </CollapsibleHelp> */}
                    <KeyValueFieldArray
                      theme={theme}
                      name="actionConfiguration.headers"
                      label="Headers"
                      actionConfig={actionConfigurationHeaders}
                      placeholder="Value"
                      dataTreePath={`${actionName}.config.headers`}
                    />
                  </TabSection>
                ),
              },
              {
                key: "params",
                title: "Params",
                panelComponent: (
                  <TabSection>
                    <KeyValueFieldArray
                      theme={theme}
                      name="actionConfiguration.queryParameters"
                      label="Params"
                      dataTreePath={`${actionName}.config.queryParameters`}
                    />
                  </TabSection>
                ),
              },
              {
                key: "body",
                title: "Body",
                panelComponent: (
                  <>
                    {allowPostBody && (
                      <PostBodyData
                        actionConfigurationHeaders={actionConfigurationHeaders}
                        actionConfiguration={actionConfigurationBody}
                        change={props.change}
                        dataTreePath={`${actionName}.config`}
                      />
                    )}
                  </>
                ),
              },
              {
                key: "pagination",
                title: "Pagination",
                panelComponent: (
                  <Pagination
                    onTestClick={props.onRunClick}
                    paginationType={props.paginationType}
                  />
                ),
              },
              {
                key: "settings",
                title: "Settings",
                panelComponent: (
                  <SettingsWrapper>
                    <ActionSettings
                      actionSettingsConfig={apiActionSettingsConfig}
                      formName={API_EDITOR_FORM_NAME}
                    />
                  </SettingsWrapper>
                ),
              },
            ]}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
        </TabbedViewContainer>

        <ApiResponseView theme={theme} />
      </SecondaryWrapper>
    </Form>
  );
};

const selector = formValueSelector(API_EDITOR_FORM_NAME);

export default connect((state: AppState) => {
  const httpMethodFromForm = selector(state, "actionConfiguration.httpMethod");
  const actionConfigurationBody = selector(state, "actionConfiguration.body");
  const actionConfigurationHeaders = selector(
    state,
    "actionConfiguration.headers",
  );
  const apiId = selector(state, "id");
  const actionName = getApiName(state, apiId) || "";

  return {
    actionName,
    apiId,
    httpMethodFromForm,
    actionConfigurationBody,
    actionConfigurationHeaders,
  };
})(
  reduxForm<RestAction, APIFormProps>({
    form: API_EDITOR_FORM_NAME,
  })(ApiEditorForm),
);
