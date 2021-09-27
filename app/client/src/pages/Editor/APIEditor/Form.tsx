import React, { useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import {
  change,
  formValueSelector,
  InjectedFormProps,
  reduxForm,
} from "redux-form";
import {
  HTTP_METHOD_OPTIONS,
  HTTP_METHODS,
} from "constants/ApiEditorConstants";
import styled from "styled-components";
import FormLabel from "components/editorComponents/FormLabel";
import FormRow from "components/editorComponents/FormRow";
import { PaginationField, SuggestedWidget } from "api/ActionAPI";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import Pagination from "./Pagination";
import { Action, PaginationType } from "entities/Action";
import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import PostBodyData from "./PostBodyData";
import ApiResponseView, {
  EMPTY_RESPONSE,
} from "components/editorComponents/ApiResponseView";
import EmbeddedDatasourcePathField from "components/editorComponents/form/fields/EmbeddedDatasourcePathField";
import { AppState } from "reducers";
import { getApiName } from "selectors/formSelectors";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import ActionSettings from "pages/Editor/ActionSettings";
import RequestDropdownField from "components/editorComponents/form/fields/RequestDropdownField";
import { ExplorerURLParams } from "../Explorer/helpers";
import MoreActionsMenu from "../Explorer/Actions/MoreActionsMenu";
import Icon from "components/ads/Icon";
import Button, { Size } from "components/ads/Button";
import { TabComponent } from "components/ads/Tabs";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import Text, { Case, TextType } from "components/ads/Text";
import { Classes, Variant } from "components/ads/common";
import Callout from "components/ads/Callout";
import { useLocalStorage } from "utils/hooks/localstorage";
import { createMessage, WIDGET_BIND_HELP } from "constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import CloseEditor from "components/editorComponents/CloseEditor";
import { useParams } from "react-router";
import { Icon as ButtonIcon } from "@blueprintjs/core";
import get from "lodash/get";
import DataSourceList from "./ApiRightPane";
import { Datasource } from "entities/Datasource";
import { getActionResponses } from "../../../selectors/entitiesSelector";
import { isEmpty } from "lodash";
import SearchSnippets from "components/ads/SnippetButton";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  width: 100%;
  ${FormLabel} {
    padding: ${(props) => props.theme.spaces[3]}px;
  }
  ${FormRow} {
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
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[10]}px 0px
    ${(props) => props.theme.spaces[10]}px;
`;

const ActionButtons = styled.div`
  justify-self: flex-end;
  display: flex;
  align-items: center;

  button:last-child {
    margin-left: ${(props) => props.theme.spaces[7]}px;
  }
`;

const HelpSection = styled.div`
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[12]}px 0px
    ${(props) => props.theme.spaces[12]}px;
`;

const DatasourceWrapper = styled.div`
  width: 100%;
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 100%;
  width: 100%;
  ${HelpSection} {
    margin-bottom: 10px;
  }
`;

export const TabbedViewContainer = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;
  height: 100%;
  border-top: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
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
      height: calc(100% - 36px);
      background-color: ${(props) => props.theme.colors.apiPane.bg};
    }
  }
`;

export const BindingText = styled.span`
  color: ${(props) => props.theme.colors.bindingTextDark};
  font-weight: 700;
`;

const SettingsWrapper = styled.div`
  padding: 16px 30px;
  height: 100%;
  ${FormLabel} {
    padding: 0px;
  }
`;

const TabSection = styled.div`
  background: white;
  height: 100%;
  overflow: auto;
`;

const NoBodyMessage = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;

  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.apiPane.body.text};
  }
`;

const CalloutContent = styled.div`
  display: flex;
  align-items: center;
`;

const Link = styled.a`
  display: flex;
  margin-left: ${(props) => props.theme.spaces[1] + 1}px;
  .${Classes.ICON} {
    margin-left: ${(props) => props.theme.spaces[1] + 1}px;
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100% - 118px);
  position: relative;
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
  actionConfigurationHeaders?: any;
  datasourceHeaders?: any;
  actionName: string;
  apiId: string;
  apiName: string;
  headersCount: number;
  paramsCount: number;
  settingsConfig: any;
  hintMessages?: Array<string>;
  datasources?: any;
  currentPageId?: string;
  applicationId?: string;
  hasResponse: boolean;
  suggestedWidgets?: SuggestedWidget[];
  updateDatasource: (datasource: Datasource) => void;
}

type Props = APIFormProps & InjectedFormProps<Action, APIFormProps>;

export const NameWrapper = styled.div`
  width: 49%;
  display: flex;
  align-items: center;
  input {
    margin: 0;
    box-sizing: border-box;
  }
`;

export const ShowHideImportedHeaders = styled.button`
  background: #ebebeb;
  color: #4b4848;
  padding: 3px 5px;
  border: none;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 12px;
  height: 20px;
`;

const Flex = styled.div<{ size: number }>`
  flex: ${(props) => props.size};
  ${(props) =>
    props.size === 3
      ? `
    margin-left: ${props.theme.spaces[4]}px;
  `
      : null};
  width: 100%;
  position: relative;
  min-height: 32px;
  height: auto;
  background-color: #fafafa;
  border-color: #d3dee3;
  border-bottom: 1px solid #e8e8e8;
  color: #4b4848;
  display: flex;
  align-items: center;
`;

const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  width: calc(100% - 30px);

  .key-value {
    padding: ${(props) => props.theme.spaces[2]}px 0px
      ${(props) => props.theme.spaces[2]}px
      ${(props) => props.theme.spaces[1]}px;
    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.apiPane.text};
    }
  }
  .key-value:nth-child(2) {
    margin-left: ${(props) => props.theme.spaces[4]}px;
  }
  .disabled {
    background: #e8e8e8;
    margin-bottom: 2px;
  }
`;

const KeyValueStackContainer = styled.div`
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[14]}px 0
    ${(props) => props.theme.spaces[11] + 2}px;
`;
const FormRowWithLabel = styled(FormRow)`
  flex-wrap: wrap;
  ${FormLabel} {
    width: 100%;
  }
  & svg {
    cursor: pointer;
  }
`;

function ImportedHeaderKeyValue(props: { headers: any }) {
  return (
    <>
      {props.headers.map((header: any, index: number) => {
        return (
          <FormRowWithLabel key={index}>
            <FlexContainer>
              <Flex className="key-value disabled" size={1}>
                <Text type={TextType.H6}>{header.key}</Text>
              </Flex>
              <Flex className="key-value disabled" size={3}>
                <Text type={TextType.H6}>{header.value}</Text>
              </Flex>
            </FlexContainer>
          </FormRowWithLabel>
        );
      })}
    </>
  );
}

const BoundaryContainer = styled.div`
  border: 1px solid transparent;
  border-right: none;
`;

function renderImportedHeadersButton(
  headersCount: number,
  onClick: any,
  showInheritedAttributes: boolean,
) {
  return (
    <KeyValueStackContainer>
      <ShowHideImportedHeaders
        onClick={(e) => {
          e.preventDefault();
          onClick(!showInheritedAttributes);
        }}
      >
        <ButtonIcon
          icon={showInheritedAttributes ? "eye-open" : "eye-off"}
          iconSize={14}
        />
        &nbsp;&nbsp;
        <Text case={Case.CAPITALIZE} type={TextType.P2}>
          {showInheritedAttributes
            ? "Showing inherited headers"
            : `${headersCount} headers`}
        </Text>
      </ShowHideImportedHeaders>
    </KeyValueStackContainer>
  );
}

function renderHelpSection(
  handleClickLearnHow: any,
  setApiBindHelpSectionVisible: any,
) {
  return (
    <HelpSection>
      <Callout
        closeButton
        fill
        label={
          <CalloutContent>
            <Link
              className="t--learn-how-apis-link"
              onClick={handleClickLearnHow}
            >
              <Text case={Case.UPPERCASE} type={TextType.H6}>
                Learn How
              </Text>
              <Icon name="right-arrow" />
            </Link>
          </CalloutContent>
        }
        onClose={() => setApiBindHelpSectionVisible(false)}
        text={createMessage(WIDGET_BIND_HELP)}
        variant={Variant.warning}
      />
    </HelpSection>
  );
}

function ImportedHeaders(props: { headers: any }) {
  const [showHeaders, toggleHeaders] = useState(false);
  return (
    <>
      {renderImportedHeadersButton(
        props.headers.length,
        toggleHeaders,
        showHeaders,
      )}
      <KeyValueStackContainer>
        <FormRowWithLabel>
          <FlexContainer>
            <Flex className="key-value" size={1}>
              <Text case={Case.CAPITALIZE} type={TextType.H6}>
                Key
              </Text>
            </Flex>
            <Flex className="key-value" size={3}>
              <Text case={Case.CAPITALIZE} type={TextType.H6}>
                Value
              </Text>
            </Flex>
          </FlexContainer>
        </FormRowWithLabel>
        {showHeaders && <ImportedHeaderKeyValue headers={props.headers} />}
      </KeyValueStackContainer>
    </>
  );
}

function ApiEditorForm(props: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [
    apiBindHelpSectionVisible,
    setApiBindHelpSectionVisible,
  ] = useLocalStorage("apiBindHelpSectionVisible", "true");

  const {
    actionConfigurationHeaders,
    actionName,
    handleSubmit,
    headersCount,
    hintMessages,
    httpMethodFromForm,
    isRunning,
    onRunClick,
    paramsCount,
    pluginId,
    settingsConfig,
    updateDatasource,
  } = props;
  const dispatch = useDispatch();
  const allowPostBody =
    httpMethodFromForm && httpMethodFromForm !== HTTP_METHODS[0];

  const params = useParams<{ apiId?: string; queryId?: string }>();

  const actions: Action[] = useSelector((state: AppState) =>
    state.entities.actions.map((action) => action.config),
  );
  const currentActionConfig: Action | undefined = actions.find(
    (action) => action.id === params.apiId || action.id === params.queryId,
  );
  const { pageId } = useParams<ExplorerURLParams>();

  const theme = EditorTheme.LIGHT;
  const handleClickLearnHow = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setGlobalSearchQuery("capturing data"));
    dispatch(toggleShowGlobalSearchModal());
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", { source: "LEARN_HOW_DATASOURCE" });
  };

  return (
    <>
      <CloseEditor />
      <Form onSubmit={handleSubmit}>
        <MainConfiguration>
          <FormRow className="form-row-header">
            <NameWrapper className="t--nameOfApi">
              <ActionNameEditor page="API_PANE" />
            </NameWrapper>
            <ActionButtons className="t--formActionButtons">
              <MoreActionsMenu
                className="t--more-action-menu"
                id={currentActionConfig ? currentActionConfig.id : ""}
                name={currentActionConfig ? currentActionConfig.name : ""}
                pageId={pageId}
              />
              <SearchSnippets
                entityId={currentActionConfig?.id}
                entityType={ENTITY_TYPE.ACTION}
              />
              <Button
                className="t--apiFormRunBtn"
                isLoading={isRunning}
                onClick={() => {
                  onRunClick();
                }}
                size={Size.medium}
                tag="button"
                text="Run"
                type="button"
              />
            </ActionButtons>
          </FormRow>
          <FormRow className="api-info-row">
            <BoundaryContainer>
              <RequestDropdownField
                className="t--apiFormHttpMethod"
                height={"35px"}
                name="actionConfiguration.httpMethod"
                optionWidth={"100px"}
                options={HTTP_METHOD_OPTIONS}
                placeholder="Method"
                width={"100px"}
              />
            </BoundaryContainer>
            <DatasourceWrapper className="t--dataSourceField">
              <EmbeddedDatasourcePathField
                name="actionConfiguration.path"
                placeholder="https://mock-api.appsmith.com/users"
                pluginId={pluginId}
                theme={theme}
              />
            </DatasourceWrapper>
          </FormRow>
        </MainConfiguration>
        {hintMessages && (
          <HelpSection>
            {hintMessages.map((msg, i) => (
              <Callout fill key={i} text={msg} variant={Variant.warning} />
            ))}
          </HelpSection>
        )}
        <Wrapper>
          <SecondaryWrapper>
            <TabbedViewContainer>
              <TabComponent
                onSelect={setSelectedIndex}
                selectedIndex={selectedIndex}
                tabs={[
                  {
                    key: "headers",
                    title: "Headers",
                    count: headersCount,
                    panelComponent: (
                      <TabSection>
                        {apiBindHelpSectionVisible &&
                          renderHelpSection(
                            handleClickLearnHow,
                            setApiBindHelpSectionVisible,
                          )}
                        {props.datasourceHeaders.length > 0 && (
                          <ImportedHeaders headers={props.datasourceHeaders} />
                        )}
                        <KeyValueFieldArray
                          actionConfig={actionConfigurationHeaders}
                          dataTreePath={`${actionName}.config.headers`}
                          hideHeader={!!props.datasourceHeaders.length}
                          label="Headers"
                          name="actionConfiguration.headers"
                          placeholder="Value"
                          pushFields
                          theme={theme}
                        />
                      </TabSection>
                    ),
                  },
                  {
                    key: "params",
                    title: "Params",
                    count: paramsCount,
                    panelComponent: (
                      <TabSection>
                        <KeyValueFieldArray
                          dataTreePath={`${actionName}.config.queryParameters`}
                          label="Params"
                          name="actionConfiguration.queryParameters"
                          pushFields
                          theme={theme}
                        />
                      </TabSection>
                    ),
                  },
                  {
                    key: "body",
                    title: "Body",
                    panelComponent: allowPostBody ? (
                      <PostBodyData
                        dataTreePath={`${actionName}.config`}
                        theme={theme}
                      />
                    ) : (
                      <NoBodyMessage>
                        <Text type={TextType.P2}>
                          This request does not have a body
                        </Text>
                      </NoBodyMessage>
                    ),
                  },
                  {
                    key: "pagination",
                    title: "Pagination",
                    panelComponent: (
                      <Pagination
                        onTestClick={props.onRunClick}
                        paginationType={props.paginationType}
                        theme={theme}
                      />
                    ),
                  },
                  {
                    key: "settings",
                    title: "Settings",
                    panelComponent: (
                      <SettingsWrapper>
                        <ActionSettings
                          actionSettingsConfig={settingsConfig}
                          formName={API_EDITOR_FORM_NAME}
                          theme={theme}
                        />
                      </SettingsWrapper>
                    ),
                  },
                ]}
              />
            </TabbedViewContainer>
            <ApiResponseView
              apiName={actionName}
              onRunClick={onRunClick}
              theme={theme}
            />
          </SecondaryWrapper>
          <DataSourceList
            actionName={actionName}
            applicationId={props.applicationId}
            currentPageId={props.currentPageId}
            datasources={props.datasources}
            hasResponse={props.hasResponse}
            onClick={updateDatasource}
            suggestedWidgets={props.suggestedWidgets}
          />
        </Wrapper>
      </Form>
    </>
  );
}

const selector = formValueSelector(API_EDITOR_FORM_NAME);

type ReduxDispatchProps = {
  updateDatasource: (datasource: Datasource) => void;
};

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  updateDatasource: (datasource) => {
    dispatch(change(API_EDITOR_FORM_NAME, "datasource", datasource));
  },
});

export default connect((state: AppState, props: { pluginId: string }) => {
  const httpMethodFromForm = selector(state, "actionConfiguration.httpMethod");
  const actionConfigurationHeaders =
    selector(state, "actionConfiguration.headers") || [];
  let datasourceFromAction = selector(state, "datasource");
  if (datasourceFromAction && datasourceFromAction.hasOwnProperty("id")) {
    datasourceFromAction = state.entities.datasources.list.find(
      (d) => d.id === datasourceFromAction.id,
    );
  }
  const datasourceHeaders =
    get(datasourceFromAction, "datasourceConfiguration.headers") || [];
  const apiId = selector(state, "id");
  const actionName = getApiName(state, apiId) || "";
  const headers = selector(state, "actionConfiguration.headers");
  let headersCount = 0;

  if (Array.isArray(headers)) {
    const validHeaders = headers.filter(
      (value) => value.key && value.key !== "",
    );
    headersCount += validHeaders.length;
  }

  if (Array.isArray(datasourceHeaders)) {
    const validHeaders = datasourceHeaders.filter(
      (value: any) => value.key && value.key !== "",
    );
    headersCount += validHeaders.length;
  }

  const params = selector(state, "actionConfiguration.queryParameters");
  let paramsCount = 0;

  if (Array.isArray(params)) {
    const validParams = params.filter((value) => value.key && value.key !== "");
    paramsCount = validParams.length;
  }
  const hintMessages = selector(state, "datasource.messages");

  const responses = getActionResponses(state);
  let hasResponse = false;
  let suggestedWidgets;
  if (apiId && apiId in responses) {
    const response = responses[apiId] || EMPTY_RESPONSE;
    hasResponse =
      !isEmpty(response.statusCode) && response.statusCode[0] === "2";
    suggestedWidgets = response.suggestedWidgets;
  }

  return {
    actionName,
    apiId,
    httpMethodFromForm,
    actionConfigurationHeaders,
    datasourceHeaders,
    headersCount,
    paramsCount,
    hintMessages,
    datasources: state.entities.datasources.list.filter(
      (d) => d.pluginId === props.pluginId,
    ),
    currentPageId: state.entities.pageList.currentPageId,
    applicationId: state.entities.pageList.applicationId,
    suggestedWidgets,
    hasResponse,
  };
}, mapDispatchToProps)(
  reduxForm<Action, APIFormProps>({
    form: API_EDITOR_FORM_NAME,
  })(ApiEditorForm),
);
