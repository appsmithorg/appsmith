import type { RefObject } from "react";
import React, { useCallback, useRef, useState } from "react";
import type { InjectedFormProps } from "redux-form";
import { Tag } from "@blueprintjs/core";
import { isString, noop } from "lodash";
import type { Datasource } from "entities/Datasource";
import {
  getPluginImages,
  getPluginNameFromId,
} from "selectors/entitiesSelector";
import FormControl from "../FormControl";
import type { Action, QueryAction, SaaSAction } from "entities/Action";
import { useDispatch, useSelector } from "react-redux";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import type { ControlProps } from "components/formControls/BaseControl";
import ActionSettings from "pages/Editor/ActionSettings";
import log from "loglevel";
import { Text, TextType } from "design-system-old";
import {
  Button,
  Callout,
  Icon,
  SegmentedControl,
  Spinner,
  Tab,
  TabPanel,
  Tabs,
  TabsList,
  Tooltip,
} from "design-system";
import styled from "styled-components";
import FormRow from "components/editorComponents/FormRow";
import DebuggerLogs from "components/editorComponents/Debugger/DebuggerLogs";
import ErrorLogs from "components/editorComponents/Debugger/Errors";
import Resizable, {
  ResizerCSS,
} from "components/editorComponents/Debugger/Resizer";
import AnalyticsUtil from "utils/AnalyticsUtil";
import CloseEditor from "components/editorComponents/CloseEditor";
import EntityDeps from "components/editorComponents/Debugger/EntityDependecies";
import {
  checkIfSectionCanRender,
  checkIfSectionIsEnabled,
  extractConditionalOutput,
  isHidden,
  modifySectionConfig,
  updateEvaluatedSectionConfig,
} from "components/formControls/utils";
import {
  ACTION_EDITOR_REFRESH,
  CREATE_NEW_DATASOURCE,
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  DOCUMENTATION,
  DOCUMENTATION_TOOLTIP,
  INSPECT_ENTITY,
  INVALID_FORM_CONFIGURATION,
  NO_DATASOURCE_FOR_QUERY,
  UNEXPECTED_ERROR,
} from "@appsmith/constants/messages";
import { useParams } from "react-router";
import type { AppState } from "@appsmith/reducers";
import type { ExplorerURLParams } from "@appsmith/pages/Editor/Explorer/helpers";
import MoreActionsMenu from "../Explorer/Actions/MoreActionsMenu";
import { thinScrollbar } from "constants/DefaultTheme";
import ActionRightPane, {
  useEntityDependencies,
} from "components/editorComponents/ActionRightPane";
import type {
  ActionApiResponseReq,
  PluginErrorDetails,
  SuggestedWidget,
} from "api/ActionAPI";
import type { Plugin } from "api/PluginApi";
import { UIComponentTypes } from "api/PluginApi";
import * as Sentry from "@sentry/react";
import EntityBottomTabs from "components/editorComponents/EntityBottomTabs";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/helpers";
import { getErrorAsString } from "sagas/ActionExecution/errorUtils";
import type { UpdateActionPropertyActionPayload } from "actions/pluginActionActions";
import Guide from "pages/Editor/GuidedTour/Guide";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { EDITOR_TABS, SQL_DATASOURCES } from "constants/QueryEditorConstants";
import type { FormEvalOutput } from "reducers/evaluationReducers/formEvaluationReducer";
import { isValidFormConfig } from "reducers/evaluationReducers/formEvaluationReducer";
import {
  apiReactJsonProps,
  NoResponse,
  responseTabComponent,
  ResponseTabErrorContainer,
  ResponseTabErrorContent,
  ResponseTabErrorDefaultMessage,
} from "components/editorComponents/ApiResponseView";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  hasCreateDatasourcePermission,
  hasDeleteActionPermission,
  hasExecuteActionPermission,
  hasManageActionPermission,
} from "@appsmith/utils/permissionHelpers";
import { getQueryPaneConfigSelectedTabIndex } from "selectors/queryPaneSelectors";
import { setQueryPaneConfigSelectedTabIndex } from "actions/queryPaneActions";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import {
  setDebuggerSelectedTab,
  setResponsePaneHeight,
  showDebugger,
} from "actions/debuggerActions";
import {
  getDebuggerSelectedTab,
  getErrorCount,
  getResponsePaneHeight,
  showDebuggerFlag,
} from "selectors/debuggerSelectors";
import LogAdditionalInfo from "components/editorComponents/Debugger/ErrorLogs/components/LogAdditionalInfo";
import LogHelper from "components/editorComponents/Debugger/ErrorLogs/components/LogHelper";
import { JsonWrapper } from "components/editorComponents/Debugger/ErrorLogs/components/LogCollapseData";
import ReactJson from "react-json-view";
import { getUpdateTimestamp } from "components/editorComponents/Debugger/ErrorLogs/ErrorLogItem";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { SourceEntity } from "entities/AppsmithConsole";
import { ENTITY_TYPE as SOURCE_ENTITY_TYPE } from "entities/AppsmithConsole";
import { DocsLink, openDoc } from "../../../constants/DocumentationLinks";
import ActionExecutionInProgressView from "components/editorComponents/ActionExecutionInProgressView";
import { CloseDebugger } from "components/editorComponents/Debugger/DebuggerTabs";

const QueryFormContainer = styled.form`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: var(--ads-v2-spaces-4) 0 0;
  width: 100%;
  .statementTextArea {
    font-size: 14px;
    line-height: 20px;
    margin-top: 5px;
  }
  .queryInput {
    max-width: 30%;
    padding-right: 10px;
  }
  .executeOnLoad {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
`;

const ErrorMessage = styled.p`
  font-size: 14px;
  color: var(--ads-v2-color-fg-error);
  display: inline-block;
  margin-right: 10px;
`;

export const TabbedViewContainer = styled.div`
  ${ResizerCSS};
  height: ${ActionExecutionResizerHeight}px;
  // Minimum height of bottom tabs as it can be resized
  min-height: 36px;
  width: 100%;
  background-color: var(--ads-v2-color-bg);
  border-top: 1px solid var(--ads-v2-color-border);
`;

const SettingsWrapper = styled.div`
  ${thinScrollbar};
  height: 100%;
`;

const ResultsCount = styled.div`
  position: absolute;
  right: ${(props) => props.theme.spaces[17] + 1}px;
  top: 9px;
  color: var(--ads-v2-color-fg);
`;

const FieldWrapper = styled.div`
  margin-top: 15px;
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

const HelpSection = styled.div``;

const ResponseContentWrapper = styled.div<{ isError: boolean }>`
  overflow-y: clip;
  display: grid;
  height: ${(props) => (props.isError ? "" : "100%")};

  ${HelpSection} {
    margin-bottom: 10px;
  }
`;

export const StyledFormRow = styled(FormRow)`
  padding: 0px var(--ads-v2-spaces-7);
  flex: 0;
`;

const NameWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  input {
    margin: 0;
    box-sizing: border-box;
  }
`;

const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 1 1 50%;
  justify-content: flex-end;
  gap: var(--ads-v2-spaces-3);
`;

const DropdownSelect = styled.div`
  font-size: 14px;
  width: 230px;
`;

const CreateDatasource = styled.div`
  display: flex;
  gap: 8px;
`;

const StyledSpinner = styled(Spinner)`
  display: flex;
  height: 2vw;
  align-items: center;
  justify-content: space-between;
  width: 5vw;
`;

const NoDataSourceContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-top: 62px;
  flex: 1;
  .font18 {
    width: 50%;
    text-align: center;
    margin-bottom: 23px;
    font-size: 18px;
  }
`;

const TabContainerView = styled.div`
  display: flex;
  align-items: start;
  flex: 1;
  overflow: auto;
  ${thinScrollbar}
  a {
    font-size: 14px;
    line-height: 20px;
    margin-top: 12px;
  }
  position: relative;

  & > .ads-v2-tabs {
    height: 100%;

    & > .ads-v2-tabs__panel {
      height: calc(100% - 50px);
      overflow-y: scroll;
    }
  }
`;

const TabsListWrapper = styled.div`
  padding: 0 var(--ads-v2-spaces-7);
`;

const TabPanelWrapper = styled(TabPanel)`
  padding: 0 var(--ads-v2-spaces-7);
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100% - 50px);
  width: 100%;
`;

const DocumentationButton = styled(Button)`
  position: absolute !important;
  right: 24px;
  margin: 7px 0px 0px;
  z-index: 6;
`;

const SidebarWrapper = styled.div<{ show: boolean }>`
  border-left: 1px solid var(--ads-v2-color-border);
  padding: 0 var(--ads-v2-spaces-7) var(--ads-v2-spaces-7);
  overflow: auto;
  border-bottom: 0;
  display: ${(props) => (props.show ? "flex" : "none")};
  width: ${(props) => props.theme.actionSidePane.width}px;
  margin-top: 38px;
  /* margin-left: var(--ads-v2-spaces-7); */
`;

export const SegmentedControlContainer = styled.div`
  padding: 0 var(--ads-v2-spaces-7);
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-4);
  overflow-y: clip;
  overflow-x: scroll;
`;

type QueryFormProps = {
  onDeleteClick: () => void;
  onRunClick: () => void;
  onCreateDatasourceClick: () => void;
  isDeleting: boolean;
  isRunning: boolean;
  dataSources: Datasource[];
  uiComponent: UIComponentTypes;
  executedQueryData?: {
    body: any;
    isExecutionSuccess?: boolean;
    messages?: Array<string>;
    suggestedWidgets?: SuggestedWidget[];
    readableError?: string;
    pluginErrorDetails?: PluginErrorDetails;
    request?: ActionApiResponseReq;
  };
  runErrorMessage: string | undefined;
  location: {
    state: any;
  };
  editorConfig?: any;
  formName: string;
  settingConfig: any;
  formData: SaaSAction | QueryAction;
  responseDisplayFormat: { title: string; value: string };
  responseDataTypes: { key: string; title: string }[];
  updateActionResponseDisplayFormat: ({
    field,
    id,
    value,
  }: UpdateActionPropertyActionPayload) => void;
};

type ReduxProps = {
  actionName: string;
  plugin?: Plugin;
  pluginId: string;
  documentationLink: string | undefined;
  formEvaluationState: FormEvalOutput;
};

export type EditorJSONtoFormProps = QueryFormProps & ReduxProps;

type Props = EditorJSONtoFormProps &
  InjectedFormProps<Action, EditorJSONtoFormProps>;

export function EditorJSONtoForm(props: Props) {
  const {
    actionName,
    dataSources,
    documentationLink,
    editorConfig,
    executedQueryData,
    formName,
    handleSubmit,
    isRunning,
    onCreateDatasourceClick,
    onRunClick,
    plugin,
    responseDataTypes,
    responseDisplayFormat,
    runErrorMessage,
    settingConfig,
    uiComponent,
    updateActionResponseDisplayFormat,
  } = props;
  let error = runErrorMessage;
  let output: Record<string, any>[] | null = null;
  let hintMessages: Array<string> = [];
  const panelRef: RefObject<HTMLDivElement> = useRef(null);

  const params = useParams<{ apiId?: string; queryId?: string }>();

  // fetch the error count from the store.
  const errorCount = useSelector(getErrorCount);

  const actions: Action[] = useSelector((state: AppState) =>
    state.entities.actions.map((action) => action.config),
  );
  const guidedTourEnabled = useSelector(inGuidedTour);
  const currentActionConfig: Action | undefined = actions.find(
    (action) => action.id === params.apiId || action.id === params.queryId,
  );
  const { pageId } = useParams<ExplorerURLParams>();
  const isChangePermitted = hasManageActionPermission(
    currentActionConfig?.userPermissions,
  );
  const isExecutePermitted = hasExecuteActionPermission(
    currentActionConfig?.userPermissions,
  );
  const isDeletePermitted = hasDeleteActionPermission(
    currentActionConfig?.userPermissions,
  );

  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state).userPermissions ?? [],
  );

  const canCreateDatasource = hasCreateDatasourcePermission(
    userWorkspacePermissions,
  );

  // get the current action's plugin name
  const currentActionPluginName = useSelector((state: AppState) =>
    getPluginNameFromId(state, currentActionConfig?.pluginId || ""),
  );

  let actionBody = "";
  if (!!currentActionConfig?.actionConfiguration) {
    if ("formData" in currentActionConfig?.actionConfiguration) {
      // if the action has a formData (the action is postUQI e.g. Oracle)
      actionBody =
        currentActionConfig.actionConfiguration.formData?.body?.data || "";
    } else {
      // if the action is pre UQI, the path is different e.g. mySQL
      actionBody = currentActionConfig.actionConfiguration?.body || "";
    }
  }

  // if (the body is empty and the action is an sql datasource) or the user does not have permission, block action execution.
  const blockExecution =
    (!actionBody && SQL_DATASOURCES.includes(currentActionPluginName)) ||
    !isExecutePermitted;

  // Query is executed even once during the session, show the response data.
  if (executedQueryData) {
    if (!executedQueryData.isExecutionSuccess) {
      // Pass the error to be shown in the error tab
      error = executedQueryData.readableError
        ? getErrorAsString(executedQueryData.readableError)
        : getErrorAsString(executedQueryData.body);
    } else if (isString(executedQueryData.body)) {
      //reset error.
      error = "";
      try {
        // Try to parse response as JSON array to be displayed in the Response tab
        output = JSON.parse(executedQueryData.body);
      } catch (e) {
        // In case the string is not a JSON, wrap it in a response object
        output = [
          {
            response: executedQueryData.body,
          },
        ];
      }
    } else {
      //reset error.
      error = "";
      output = executedQueryData.body;
    }
    if (executedQueryData.messages && executedQueryData.messages.length) {
      //reset error.
      error = "";
      hintMessages = executedQueryData.messages;
    }
  }

  const dispatch = useDispatch();

  const handleDocumentationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDoc(DocsLink.QUERY, plugin?.documentationLink, plugin?.name);
  };

  // Added function to handle the render of the configs
  const renderConfig = (editorConfig: any) => {
    try {
      // Selectively rendering form based on uiComponent prop
      if (uiComponent === UIComponentTypes.UQIDbEditorForm) {
        // If the formEvaluation is not ready yet, just show loading state.
        if (
          props.hasOwnProperty("formEvaluationState") &&
          !!props.formEvaluationState &&
          Object.keys(props.formEvaluationState).length > 0
        ) {
          return editorConfig.map((config: any, idx: number) => {
            return renderEachConfigV2(formName, config, idx);
          });
        } else {
          return <StyledSpinner size="md" />;
        }
      } else {
        return editorConfig.map(renderEachConfig(formName));
      }
    } catch (e) {
      log.error(e);
      Sentry.captureException(e);
      return (
        <>
          <ErrorMessage>
            {createMessage(INVALID_FORM_CONFIGURATION)}
          </ErrorMessage>
          <Tag
            intent="warning"
            interactive
            minimal
            onClick={() => window.location.reload()}
            round
          >
            {createMessage(ACTION_EDITOR_REFRESH)}
          </Tag>
        </>
      );
    }
  };

  // Render function to render the V2 of form editor type (UQI)
  // Section argument is a nested config object, this function recursively renders the UI based on the config
  const renderEachConfigV2 = (formName: string, section: any, idx: number) => {
    let enabled = true;
    if (!!section) {
      // If the section is a nested component, recursively check for conditional statements
      if (
        "schema" in section &&
        Array.isArray(section.schema) &&
        section.schema.length > 0
      ) {
        section.schema = section.schema.map((subSection: any) => {
          const conditionalOutput = extractConditionalOutput(
            subSection,
            props.formEvaluationState,
          );
          if (!checkIfSectionCanRender(conditionalOutput)) {
            subSection.hidden = true;
          } else {
            subSection.hidden = false;
          }
          enabled = checkIfSectionIsEnabled(conditionalOutput);
          subSection = updateEvaluatedSectionConfig(
            subSection,
            conditionalOutput,
            enabled,
          );
          if (!isValidFormConfig(subSection)) return null;
          return subSection;
        });
      }
      // If the component is not allowed to render, return null
      const conditionalOutput = extractConditionalOutput(
        section,
        props.formEvaluationState,
      );
      if (!checkIfSectionCanRender(conditionalOutput)) return null;
      section = updateEvaluatedSectionConfig(section, conditionalOutput);
      enabled = checkIfSectionIsEnabled(conditionalOutput);
      if (!isValidFormConfig(section)) return null;
    }
    if (section.hasOwnProperty("controlType")) {
      // If component is type section, render it's children
      if (
        section.controlType === "SECTION" &&
        section.hasOwnProperty("children")
      ) {
        return section.children.map((section: any, idx: number) => {
          return renderEachConfigV2(formName, section, idx);
        });
      }
      try {
        const { configProperty } = section;
        const modifiedSection = modifySectionConfig(section, enabled);
        return (
          <FieldWrapper key={`${configProperty}_${idx}`}>
            <FormControl config={modifiedSection} formName={formName} />
          </FieldWrapper>
        );
      } catch (e) {
        log.error(e);
      }
    } else {
      return section.map((section: any, idx: number) => {
        renderEachConfigV2(formName, section, idx);
      });
    }
    return null;
  };

  // Recursive call to render forms pre UQI
  const renderEachConfig =
    (formName: string) =>
    (section: any): any => {
      return section.children.map(
        (formControlOrSection: ControlProps, idx: number) => {
          if (isHidden(props.formData, section.hidden, undefined, false))
            return null;
          if (formControlOrSection.hasOwnProperty("children")) {
            return renderEachConfig(formName)(formControlOrSection);
          } else {
            try {
              const { configProperty } = formControlOrSection;
              return (
                <FieldWrapper key={`${configProperty}_${idx}`}>
                  <FormControl
                    config={formControlOrSection}
                    formName={formName}
                  />
                </FieldWrapper>
              );
            } catch (e) {
              log.error(e);
            }
          }
          return null;
        },
      );
    };

  const responseTabOnRunClick = () => {
    props.onRunClick();

    AnalyticsUtil.logEvent("RESPONSE_TAB_RUN_ACTION_CLICK", {
      source: "QUERY_PANE",
    });
  };

  // get the response pane height from the store.
  const responsePaneHeight = useSelector(getResponsePaneHeight);
  // set the response pane height on resize.
  const setQueryResponsePaneHeight = useCallback((height: number) => {
    dispatch(setResponsePaneHeight(height));
  }, []);

  const responseBodyTabs =
    responseDataTypes &&
    responseDataTypes.map((dataType, index) => {
      return {
        index: index,
        key: dataType.key,
        title: dataType.title,
        panelComponent: responseTabComponent(
          dataType.key,
          output,
          responsePaneHeight,
        ),
      };
    });

  const segmentedControlOptions =
    responseBodyTabs &&
    responseBodyTabs.map((item) => {
      return { value: item.key, label: item.title };
    });

  const [selectedControl, setSelectedControl] = useState(
    segmentedControlOptions[0]?.value,
  );

  const onResponseTabSelect = (tabKey: string) => {
    if (tabKey === DEBUGGER_TAB_KEYS.ERROR_TAB) {
      AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
        source: "QUERY_PANE",
      });
    }
    updateActionResponseDisplayFormat({
      id: currentActionConfig?.id || "",
      field: "responseDisplayFormat",
      value: tabKey,
    });
  };

  // onResponseTabSelect(selectedControl);

  const selectedTabIndex =
    responseDataTypes &&
    responseDataTypes.findIndex(
      (dataType) => dataType.title === responseDisplayFormat?.title,
    );

  //Update request timestamp to human readable format.
  const responseState =
    executedQueryData && getUpdateTimestamp(executedQueryData.request);

  // action source for analytics.
  const actionSource: SourceEntity = {
    type: SOURCE_ENTITY_TYPE.ACTION,
    name: currentActionConfig ? currentActionConfig.name : "",
    id: currentActionConfig ? currentActionConfig.id : "",
  };

  const responseTabs = [
    {
      key: "response",
      title: "Response",
      panelComponent: (
        <ResponseContentWrapper isError={!!error}>
          {error && (
            <ResponseTabErrorContainer>
              <ResponseTabErrorContent>
                <ResponseTabErrorDefaultMessage>
                  Your query failed to execute
                  {executedQueryData &&
                    (executedQueryData.pluginErrorDetails ||
                      executedQueryData.body) &&
                    ":"}
                </ResponseTabErrorDefaultMessage>
                {executedQueryData &&
                  (executedQueryData.pluginErrorDetails ? (
                    <>
                      <div data-testid="t--query-error">
                        {
                          executedQueryData.pluginErrorDetails
                            .downstreamErrorMessage
                        }
                      </div>
                      {executedQueryData.pluginErrorDetails
                        .downstreamErrorCode && (
                        <LogAdditionalInfo
                          text={
                            executedQueryData.pluginErrorDetails
                              .downstreamErrorCode
                          }
                        />
                      )}
                    </>
                  ) : (
                    executedQueryData.body && (
                      <div data-testid="t--query-error">
                        {executedQueryData.body}
                      </div>
                    )
                  ))}
                <LogHelper
                  logType={LOG_TYPE.ACTION_EXECUTION_ERROR}
                  name="PluginExecutionError"
                  pluginErrorDetails={
                    executedQueryData && executedQueryData.pluginErrorDetails
                  }
                  source={actionSource}
                />
              </ResponseTabErrorContent>
              {executedQueryData && executedQueryData.request && (
                <JsonWrapper
                  className="t--debugger-log-state"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ReactJson src={responseState} {...apiReactJsonProps} />
                </JsonWrapper>
              )}
            </ResponseTabErrorContainer>
          )}
          {hintMessages && hintMessages.length > 0 && (
            <HelpSection>
              {hintMessages.map((msg, index) => (
                <Callout key={index} kind="warning">
                  {msg}
                </Callout>
              ))}
            </HelpSection>
          )}
          {currentActionConfig &&
            output &&
            responseBodyTabs &&
            responseBodyTabs.length > 0 &&
            selectedTabIndex !== -1 && (
              <SegmentedControlContainer>
                <SegmentedControl
                  data-testid="t--response-tab-segmented-control"
                  defaultValue={segmentedControlOptions[0]?.value}
                  isFullWidth={false}
                  onChange={(value) => {
                    setSelectedControl(value);
                    onResponseTabSelect(value);
                  }}
                  options={segmentedControlOptions}
                  value={selectedControl}
                />
                {responseTabComponent(
                  selectedControl || segmentedControlOptions[0]?.value,
                  output,
                  responsePaneHeight,
                )}
              </SegmentedControlContainer>
            )}
          {!output && !error && (
            <NoResponse
              isButtonDisabled={!isExecutePermitted}
              isQueryRunning={isRunning}
              onRunClick={responseTabOnRunClick}
            />
          )}
        </ResponseContentWrapper>
      ),
    },
    {
      key: DEBUGGER_TAB_KEYS.ERROR_TAB,
      title: createMessage(DEBUGGER_ERRORS),
      count: errorCount,
      panelComponent: <ErrorLogs />,
    },
    {
      key: DEBUGGER_TAB_KEYS.LOGS_TAB,
      title: createMessage(DEBUGGER_LOGS),
      panelComponent: <DebuggerLogs searchQuery={actionName} />,
    },
    {
      key: DEBUGGER_TAB_KEYS.INSPECT_TAB,
      title: createMessage(INSPECT_ENTITY),
      panelComponent: <EntityDeps />,
    },
  ];

  const { entityDependencies, hasDependencies } = useEntityDependencies(
    props.actionName,
  );

  const pluginImages = useSelector(getPluginImages);

  type DATASOURCES_OPTIONS_TYPE = {
    label: string;
    value: string;
    image: string;
  };

  // Filtering the datasources for listing the similar datasources only rather than having all the active datasources in the list, which on switching resulted in error.
  const DATASOURCES_OPTIONS: Array<DATASOURCES_OPTIONS_TYPE> =
    dataSources.reduce(
      (acc: Array<DATASOURCES_OPTIONS_TYPE>, dataSource: Datasource) => {
        if (dataSource.pluginId === plugin?.id) {
          acc.push({
            label: dataSource.name,
            value: dataSource.id,
            image: pluginImages[dataSource.pluginId],
          });
        }
        return acc;
      },
      [],
    );

  const selectedConfigTab = useSelector(getQueryPaneConfigSelectedTabIndex);

  // Debugger render flag
  const renderDebugger = useSelector(showDebuggerFlag);

  const setSelectedConfigTab = useCallback((selectedIndex: string) => {
    dispatch(setQueryPaneConfigSelectedTabIndex(selectedIndex));
  }, []);

  const selectedResponseTab = useSelector(getDebuggerSelectedTab);

  const setSelectedResponseTab = useCallback((tabKey: string) => {
    dispatch(setDebuggerSelectedTab(tabKey));
  }, []);

  // close the debugger
  //TODO: move this to a common place
  const onClose = () => dispatch(showDebugger(false));

  // when switching between different redux forms, make sure this redux form has been initialized before rendering anything.
  // the initialized prop below comes from redux-form.
  if (!props.initialized) {
    return null;
  }

  return (
    <>
      {!guidedTourEnabled && <CloseEditor />}
      {guidedTourEnabled && <Guide className="query-page" />}
      <QueryFormContainer onSubmit={handleSubmit(noop)}>
        <StyledFormRow>
          <NameWrapper>
            <ActionNameEditor disabled={!isChangePermitted} />
          </NameWrapper>
          <ActionsWrapper>
            <MoreActionsMenu
              className="t--more-action-menu"
              id={currentActionConfig ? currentActionConfig.id : ""}
              isChangePermitted={isChangePermitted}
              isDeletePermitted={isDeletePermitted}
              name={currentActionConfig ? currentActionConfig.name : ""}
              pageId={pageId}
            />
            <DropdownSelect>
              <DropdownField
                className={"t--switch-datasource"}
                formName={formName}
                isDisabled={!isChangePermitted}
                name="datasource.id"
                options={DATASOURCES_OPTIONS}
                placeholder="Datasource"
              >
                {canCreateDatasource && (
                  // this additional div is here so that rc-select can render the child with the onClick correctly
                  <div>
                    <CreateDatasource onClick={() => onCreateDatasourceClick()}>
                      <Icon className="createIcon" name="plus" size="md" />
                      {createMessage(CREATE_NEW_DATASOURCE)}
                    </CreateDatasource>
                  </div>
                )}
              </DropdownField>
            </DropdownSelect>
            <Button
              className="t--run-query"
              data-guided-tour-iid="run-query"
              isDisabled={blockExecution}
              isLoading={isRunning}
              onClick={onRunClick}
              size="md"
            >
              Run
            </Button>
          </ActionsWrapper>
        </StyledFormRow>
        <Wrapper>
          <div className="flex flex-1">
            <SecondaryWrapper>
              <TabContainerView>
                <Tabs
                  onValueChange={setSelectedConfigTab}
                  value={selectedConfigTab || EDITOR_TABS.QUERY}
                >
                  <TabsListWrapper>
                    <TabsList>
                      <Tab
                        data-testid={`t--query-editor-` + EDITOR_TABS.QUERY}
                        value={EDITOR_TABS.QUERY}
                      >
                        Query
                      </Tab>
                      <Tab
                        data-testid={`t--query-editor-` + EDITOR_TABS.SETTINGS}
                        value={EDITOR_TABS.SETTINGS}
                      >
                        Settings
                      </Tab>
                    </TabsList>
                  </TabsListWrapper>
                  <TabPanelWrapper
                    className="tab-panel"
                    value={EDITOR_TABS.QUERY}
                  >
                    <SettingsWrapper>
                      {editorConfig && editorConfig.length > 0 ? (
                        renderConfig(editorConfig)
                      ) : (
                        <>
                          <ErrorMessage>
                            {createMessage(UNEXPECTED_ERROR)}
                          </ErrorMessage>
                          <Tag
                            intent="warning"
                            interactive
                            minimal
                            onClick={() => window.location.reload()}
                            round
                          >
                            {createMessage(ACTION_EDITOR_REFRESH)}
                          </Tag>
                        </>
                      )}
                      {dataSources.length === 0 && (
                        <NoDataSourceContainer>
                          <p className="font18">
                            {createMessage(NO_DATASOURCE_FOR_QUERY)}
                          </p>
                          <Button
                            isDisabled={!canCreateDatasource}
                            kind="primary"
                            onClick={() => onCreateDatasourceClick()}
                            size="sm"
                            startIcon="plus"
                          >
                            Add a Datasource
                          </Button>
                        </NoDataSourceContainer>
                      )}
                    </SettingsWrapper>
                  </TabPanelWrapper>
                  <TabPanelWrapper value={EDITOR_TABS.SETTINGS}>
                    <SettingsWrapper>
                      <ActionSettings
                        actionSettingsConfig={settingConfig}
                        formName={formName}
                      />
                    </SettingsWrapper>
                  </TabPanelWrapper>
                </Tabs>
                {documentationLink && (
                  <Tooltip
                    content={createMessage(DOCUMENTATION_TOOLTIP)}
                    placement="top"
                  >
                    <DocumentationButton
                      className="t--datasource-documentation-link"
                      kind="tertiary"
                      onClick={(e: React.MouseEvent) =>
                        handleDocumentationClick(e)
                      }
                      size="sm"
                      startIcon="book-line"
                    >
                      {createMessage(DOCUMENTATION)}
                    </DocumentationButton>
                  </Tooltip>
                )}
              </TabContainerView>
              {renderDebugger &&
                selectedResponseTab !== DEBUGGER_TAB_KEYS.HEADER_TAB && (
                  <TabbedViewContainer
                    className="t--query-bottom-pane-container"
                    ref={panelRef}
                  >
                    <Resizable
                      initialHeight={responsePaneHeight}
                      onResizeComplete={(height: number) =>
                        setQueryResponsePaneHeight(height)
                      }
                      openResizer={isRunning}
                      panelRef={panelRef}
                      snapToHeight={ActionExecutionResizerHeight}
                    />
                    {isRunning && (
                      <ActionExecutionInProgressView
                        actionType="query"
                        theme={EditorTheme.LIGHT}
                      />
                    )}

                    {output && !!output.length && (
                      <ResultsCount>
                        <Text type={TextType.P3}>
                          Result:
                          <Text type={TextType.H5}>{` ${output.length} Record${
                            output.length > 1 ? "s" : ""
                          }`}</Text>
                        </Text>
                      </ResultsCount>
                    )}

                    <EntityBottomTabs
                      expandedHeight={`${ActionExecutionResizerHeight}px`}
                      onSelect={setSelectedResponseTab}
                      selectedTabKey={selectedResponseTab}
                      tabs={responseTabs}
                    />
                    <CloseDebugger
                      className="close-debugger t--close-debugger"
                      isIconButton
                      kind="tertiary"
                      onClick={onClose}
                      size="md"
                      startIcon="close-modal"
                    />
                  </TabbedViewContainer>
                )}
            </SecondaryWrapper>
          </div>
          <SidebarWrapper
            show={(hasDependencies || !!output) && !guidedTourEnabled}
          >
            <ActionRightPane
              actionName={actionName}
              entityDependencies={entityDependencies}
              hasConnections={hasDependencies}
              hasResponse={!!output}
              suggestedWidgets={executedQueryData?.suggestedWidgets}
            />
          </SidebarWrapper>
        </Wrapper>
      </QueryFormContainer>
    </>
  );
}
