import { useContext, useEffect, useState } from "react";
import React, { useCallback } from "react";
import type { InjectedFormProps } from "redux-form";
import { Tag } from "@blueprintjs/core";
import { noop } from "lodash";
import type { Datasource } from "entities/Datasource";
import { DatasourceStructureContext } from "entities/Datasource";
import {
  getPluginImages,
  getPluginNameFromId,
} from "@appsmith/selectors/entitiesSelector";
import FormControl from "../FormControl";
import {
  PluginName,
  type Action,
  type QueryAction,
  type SaaSAction,
} from "entities/Action";
import { useDispatch, useSelector } from "react-redux";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import type { ControlProps } from "components/formControls/BaseControl";
import ActionSettings from "pages/Editor/ActionSettings";
import log from "loglevel";
import {
  Button,
  Icon,
  Spinner,
  Tab,
  TabPanel,
  Tabs,
  TabsList,
  Tooltip,
} from "design-system";
import styled from "styled-components";
import FormRow from "components/editorComponents/FormRow";
import { ResizerCSS } from "components/editorComponents/Debugger/Resizer";
import AnalyticsUtil from "utils/AnalyticsUtil";
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
  DOCUMENTATION,
  DOCUMENTATION_TOOLTIP,
  INVALID_FORM_CONFIGURATION,
  NO_DATASOURCE_FOR_QUERY,
  UNEXPECTED_ERROR,
} from "@appsmith/constants/messages";
import { useParams } from "react-router";
import type { AppState } from "@appsmith/reducers";
import { thinScrollbar } from "constants/DefaultTheme";
import ActionRightPane, {
  useEntityDependencies,
} from "components/editorComponents/ActionRightPane";
import type { ActionResponse } from "api/ActionAPI";
import type { Plugin } from "api/PluginApi";
import { UIComponentTypes } from "api/PluginApi";
import * as Sentry from "@sentry/react";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/helpers";
import Guide from "pages/Editor/GuidedTour/Guide";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { EDITOR_TABS, SQL_DATASOURCES } from "constants/QueryEditorConstants";
import type { FormEvalOutput } from "reducers/evaluationReducers/formEvaluationReducer";
import { isValidFormConfig } from "reducers/evaluationReducers/formEvaluationReducer";
import { getQueryPaneConfigSelectedTabIndex } from "selectors/queryPaneSelectors";
import { setQueryPaneConfigSelectedTabIndex } from "actions/queryPaneActions";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import {
  getDebuggerSelectedTab,
  showDebuggerFlag,
} from "selectors/debuggerSelectors";
import type { SourceEntity } from "entities/AppsmithConsole";
import { ENTITY_TYPE as SOURCE_ENTITY_TYPE } from "entities/AppsmithConsole";
import { DocsLink, openDoc } from "../../../constants/DocumentationLinks";
import {
  getHasCreateDatasourcePermission,
  getHasExecuteActionPermission,
  getHasManageActionPermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { QueryEditorContext } from "./QueryEditorContext";
import QueryResponseTabView from "./QueryResponseView";
import { setDebuggerSelectedTab, showDebugger } from "actions/debuggerActions";

const QueryFormContainer = styled.form`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: var(--ads-v2-spaces-5) 0 0;
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

const FieldWrapper = styled.div`
  margin-top: 15px;
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

export const StyledFormRow = styled(FormRow)`
  padding: 0px var(--ads-v2-spaces-7) var(--ads-v2-spaces-5)
    var(--ads-v2-spaces-7);
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
  padding: 0 var(--ads-v2-spaces-7) var(--ads-v2-spaces-4);
  overflow: hidden;
  border-bottom: 0;
  display: ${(props) => (props.show ? "flex" : "none")};
  width: ${(props) => props.theme.actionSidePane.width}px;
  margin-top: 10px;
  /* margin-left: var(--ads-v2-spaces-7); */
`;

export const SegmentedControlContainer = styled.div`
  padding: 0 var(--ads-v2-spaces-7);
  padding-top: var(--ads-v2-spaces-4);
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-4);
  overflow-y: clip;
  overflow-x: scroll;
`;

interface QueryFormProps {
  onDeleteClick: () => void;
  onRunClick: () => void;
  onCreateDatasourceClick: () => void;
  isDeleting: boolean;
  isRunning: boolean;
  dataSources: Datasource[];
  uiComponent: UIComponentTypes;
  actionResponse?: ActionResponse;
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
  datasourceId: string;
  showCloseEditor: boolean;
}

interface ReduxProps {
  actionName: string;
  plugin?: Plugin;
  pluginId: string;
  documentationLink: string | undefined;
  formEvaluationState: FormEvalOutput;
}

export type EditorJSONtoFormProps = QueryFormProps & ReduxProps;

type Props = EditorJSONtoFormProps &
  InjectedFormProps<Action, EditorJSONtoFormProps>;

export function EditorJSONtoForm(props: Props) {
  const {
    actionName,
    actionResponse,
    dataSources,
    documentationLink,
    editorConfig,
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
  } = props;

  const {
    actionRightPaneAdditionSections,
    actionRightPaneBackLink,
    closeEditorLink,
    moreActionsMenu,
    saveActionName,
  } = useContext(QueryEditorContext);

  const params = useParams<{ apiId?: string; queryId?: string }>();
  // fetch the error count from the store.
  const actions: Action[] = useSelector((state: AppState) =>
    state.entities.actions.map((action) => action.config),
  );
  const guidedTourEnabled = useSelector(inGuidedTour);
  const currentActionConfig: Action | undefined = actions.find(
    (action) => action.id === params.apiId || action.id === params.queryId,
  );
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const [showResponseOnFirstLoad, setShowResponseOnFirstLoad] =
    useState<boolean>(false);

  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    currentActionConfig?.userPermissions,
  );
  const isExecutePermitted = getHasExecuteActionPermission(
    isFeatureEnabled,
    currentActionConfig?.userPermissions,
  );

  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state).userPermissions ?? [],
  );

  const canCreateDatasource = getHasCreateDatasourcePermission(
    isFeatureEnabled,
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

  const dispatch = useDispatch();

  // These useEffects are used to open the response tab by default for page load queries
  // as for page load queries, query response is available and can be shown in response tab
  useEffect(() => {
    // actionResponse and responseDisplayFormat is present only when query has response available
    if (
      responseDisplayFormat &&
      !!responseDisplayFormat?.title &&
      actionResponse &&
      actionResponse.isExecutionSuccess &&
      !showResponseOnFirstLoad
    ) {
      dispatch(showDebugger(true));
      dispatch(setDebuggerSelectedTab(DEBUGGER_TAB_KEYS.RESPONSE_TAB));
      setShowResponseOnFirstLoad(true);
    }
  }, [responseDisplayFormat, actionResponse, showResponseOnFirstLoad]);

  // When multiple page load queries exist, we want to response tab by default for all of them
  // Hence this useEffect will reset showResponseOnFirstLoad flag used to track whether to show response tab or not
  useEffect(() => {
    if (!!currentActionConfig?.id) {
      setShowResponseOnFirstLoad(false);
    }
  }, [currentActionConfig?.id]);

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

  // onResponseTabSelect(selectedControl);

  // action source for analytics.
  const actionSource: SourceEntity = {
    type: SOURCE_ENTITY_TYPE.ACTION,
    name: currentActionConfig ? currentActionConfig.name : "",
    id: currentActionConfig ? currentActionConfig.id : "",
  };

  const { hasDependencies } = useEntityDependencies(props.actionName);

  const pluginImages = useSelector(getPluginImages);

  interface DATASOURCES_OPTIONS_TYPE {
    label: string;
    value: string;
    image: string;
  }

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

  // here we check for normal conditions for opening action pane
  // or if any of the flags are true, We should open the actionpane by default.
  const shouldOpenActionPaneByDefault =
    ((hasDependencies || !!actionResponse) && !guidedTourEnabled) ||
    currentActionPluginName !== PluginName.SMTP;

  // when switching between different redux forms, make sure this redux form has been initialized before rendering anything.
  // the initialized prop below comes from redux-form.
  if (!props.initialized) {
    return null;
  }

  return (
    <>
      {!guidedTourEnabled && closeEditorLink}
      {guidedTourEnabled && <Guide className="query-page" />}
      <QueryFormContainer onSubmit={handleSubmit(noop)}>
        <StyledFormRow>
          <NameWrapper>
            <ActionNameEditor
              disabled={!isChangePermitted}
              saveActionName={saveActionName}
            />
          </NameWrapper>
          <ActionsWrapper>
            {moreActionsMenu}
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
                  <QueryResponseTabView
                    actionName={actionName}
                    actionResponse={actionResponse}
                    actionSource={actionSource}
                    currentActionConfig={currentActionConfig}
                    isExecutePermitted={isExecutePermitted}
                    isRunning={isRunning}
                    responseDataTypes={responseDataTypes}
                    responseDisplayFormat={responseDisplayFormat}
                    responseTabOnRunClick={responseTabOnRunClick}
                    runErrorMessage={runErrorMessage}
                  />
                )}
            </SecondaryWrapper>
          </div>
          <SidebarWrapper show={shouldOpenActionPaneByDefault}>
            <ActionRightPane
              actionName={actionName}
              actionRightPaneBackLink={actionRightPaneBackLink}
              additionalSections={actionRightPaneAdditionSections}
              context={DatasourceStructureContext.QUERY_EDITOR}
              datasourceId={props.datasourceId}
              hasConnections={hasDependencies}
              hasResponse={!!actionResponse}
              pluginId={props.pluginId}
              suggestedWidgets={actionResponse?.suggestedWidgets}
            />
          </SidebarWrapper>
        </Wrapper>
      </QueryFormContainer>
    </>
  );
}
