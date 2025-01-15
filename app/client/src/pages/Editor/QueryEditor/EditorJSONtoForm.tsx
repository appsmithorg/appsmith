import { useContext } from "react";
import React, { useCallback } from "react";
import type { InjectedFormProps } from "redux-form";
import { noop } from "lodash";
import type { Datasource } from "entities/Datasource";
import type { Action, QueryAction, SaaSAction } from "entities/Action";
import { useDispatch, useSelector } from "react-redux";
import ActionSettings from "pages/Editor/ActionSettings";
import { Button, Tab, TabPanel, Tabs, TabsList, Tooltip } from "@appsmith/ads";
import styled from "styled-components";
import FormRow from "components/editorComponents/FormRow";
import {
  createMessage,
  DOCUMENTATION,
  DOCUMENTATION_TOOLTIP,
} from "ee/constants/messages";
import { useParams } from "react-router";
import type { AppState } from "ee/reducers";
import { thinScrollbar } from "constants/DefaultTheme";
import type { ActionResponse } from "api/ActionAPI";
import type { Plugin, UIComponentTypes } from "entities/Plugin";
import { EDITOR_TABS, SQL_DATASOURCES } from "constants/QueryEditorConstants";
import type { FormEvalOutput } from "reducers/evaluationReducers/formEvaluationReducer";
import {
  getPluginActionConfigSelectedTab,
  setPluginActionEditorSelectedTab,
} from "PluginActionEditor/store";
import type { SourceEntity } from "entities/AppsmithConsole";
import { ENTITY_TYPE as SOURCE_ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import { DocsLink, openDoc } from "constants/DocumentationLinks";
import { QueryEditorContext } from "./QueryEditorContext";
import QueryDebuggerTabs from "./QueryDebuggerTabs";
import useShowSchema from "PluginActionEditor/components/PluginActionResponse/hooks/useShowSchema";
import { doesPluginRequireDatasource } from "ee/entities/Engine/actionHelpers";
import FormRender from "PluginActionEditor/components/PluginActionForm/components/UQIEditor/FormRender";
import QueryEditorHeader from "./QueryEditorHeader";
import RunHistory from "ee/components/RunHistory";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasExecuteActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { getPluginNameFromId } from "ee/selectors/entitiesSelector";

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

const SettingsWrapper = styled.div`
  ${thinScrollbar};
  height: 100%;
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

export const StyledFormRow = styled(FormRow)`
  padding: 0 var(--ads-v2-spaces-7) var(--ads-v2-spaces-5)
    var(--ads-v2-spaces-7);
  flex: 0;
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
  overflow: hidden;
  width: 100%;
`;

const DocumentationButton = styled(Button)`
  position: absolute !important;
  right: 24px;
  margin: 7px 0 0;
  z-index: 6;
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

const StyledNotificationWrapper = styled.div`
  padding: 0 var(--ads-v2-spaces-7) var(--ads-v2-spaces-3)
    var(--ads-v2-spaces-7);
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: any;
  };
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editorConfig?: any;
  formName: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settingConfig: any;
  formData: SaaSAction | QueryAction;
  responseDisplayFormat: { title: string; value: string };
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
    runErrorMessage,
    settingConfig,
    uiComponent,
  } = props;

  const { actionRightPaneAdditionSections, notification } =
    useContext(QueryEditorContext);

  const params = useParams<{ baseApiId?: string; baseQueryId?: string }>();
  // fetch the error count from the store.
  const actions: Action[] = useSelector((state: AppState) =>
    state.entities.actions.map((action) => action.config),
  );
  const currentActionConfig: Action | undefined = actions.find(
    (action) =>
      action.baseId === params.baseApiId ||
      action.baseId === params.baseQueryId,
  );

  const pluginRequireDatasource = doesPluginRequireDatasource(plugin);

  const showSchema =
    useShowSchema(currentActionConfig?.pluginId || "") &&
    pluginRequireDatasource;

  const dispatch = useDispatch();

  const handleDocumentationClick = () => {
    openDoc(DocsLink.QUERY, plugin?.documentationLink, plugin?.name);
  };

  // action source for analytics.
  const actionSource: SourceEntity = {
    type: SOURCE_ENTITY_TYPE.ACTION,
    name: currentActionConfig ? currentActionConfig.name : "",
    id: currentActionConfig ? currentActionConfig.id : "",
  };

  const selectedTab = useSelector(getPluginActionConfigSelectedTab);

  const setSelectedConfigTab = useCallback(
    (selectedIndex: string) => {
      dispatch(setPluginActionEditorSelectedTab(selectedIndex));
    },
    [dispatch],
  );

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isExecutePermitted = getHasExecuteActionPermission(
    isFeatureEnabled,
    currentActionConfig?.userPermissions,
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

  // when switching between different redux forms, make sure this redux form has been initialized before rendering anything.
  // the initialized prop below comes from redux-form.
  if (!props.initialized) {
    return null;
  }

  return (
    <QueryFormContainer onSubmit={handleSubmit(noop)}>
      <QueryEditorHeader
        dataSources={dataSources}
        formName={formName}
        isRunDisabled={blockExecution}
        isRunning={isRunning}
        onCreateDatasourceClick={onCreateDatasourceClick}
        onRunClick={onRunClick}
        plugin={plugin}
      />
      {notification && (
        <StyledNotificationWrapper>{notification}</StyledNotificationWrapper>
      )}
      <Wrapper>
        <div className="flex flex-1 w-full">
          <SecondaryWrapper>
            <TabContainerView>
              <Tabs
                onValueChange={setSelectedConfigTab}
                value={selectedTab || EDITOR_TABS.QUERY}
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
                  <SettingsWrapper
                    data-testid={`t--action-form-${plugin?.type}`}
                  >
                    <FormRender
                      editorConfig={editorConfig}
                      formData={props.formData}
                      formEvaluationState={props.formEvaluationState}
                      formName={formName}
                      uiComponent={uiComponent}
                    />
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
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleDocumentationClick();
                    }}
                    size="sm"
                    startIcon="book-line"
                  >
                    {createMessage(DOCUMENTATION)}
                  </DocumentationButton>
                </Tooltip>
              )}
            </TabContainerView>
            <QueryDebuggerTabs
              actionName={actionName}
              actionResponse={actionResponse}
              actionSource={actionSource}
              currentActionConfig={currentActionConfig}
              isRunDisabled={blockExecution}
              isRunning={isRunning}
              onRunClick={onRunClick}
              runErrorMessage={runErrorMessage}
              showSchema={showSchema}
            />
            <RunHistory />
          </SecondaryWrapper>
        </div>
        {actionRightPaneAdditionSections}
      </Wrapper>
    </QueryFormContainer>
  );
}
