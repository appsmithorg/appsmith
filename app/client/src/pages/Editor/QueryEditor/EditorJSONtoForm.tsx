import {
  DOCUMENTATION,
  DOCUMENTATION_TOOLTIP,
  createMessage,
} from "@appsmith/constants/messages";
import { ENTITY_TYPE as SOURCE_ENTITY_TYPE } from "@appsmith/entities/AppsmithConsole/utils";
import { doesPluginRequireDatasource } from "@appsmith/entities/Engine/actionHelpers";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import type { AppState } from "@appsmith/reducers";
import { getPluginNameFromId } from "@appsmith/selectors/entitiesSelector";
import { setQueryPaneConfigSelectedTabIndex } from "actions/queryPaneActions";
import type { Plugin, UIComponentTypes } from "api/PluginApi";
import type { ActionResponse } from "api/actionAPITypes";
import ActionRightPane, {
  useEntityDependencies,
} from "components/editorComponents/ActionRightPane";
import useShowSchema from "components/editorComponents/ActionRightPane/useShowSchema";
import type { FormEvalOutput } from "components/formControls/formControlTypes";
import { EDITOR_TABS } from "constants/QueryEditorConstants";
import { Tab, Tabs, TabsList, Tooltip } from "design-system";
import {
  PluginName,
  type Action,
  type QueryAction,
  type SaaSAction,
} from "entities/Action";
import type { SourceEntity } from "entities/AppsmithConsole";
import type { Datasource } from "entities/Datasource";
import { noop } from "lodash";
import ActionSettings from "pages/Editor/ActionSettings";
import React, { useCallback, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import type { InjectedFormProps } from "redux-form";
import { getQueryPaneConfigSelectedTabIndex } from "selectors/queryPaneSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { DocsLink, openDoc } from "../../../constants/DocumentationLinks";
import ActionEditor from "../IDE/EditorPane/components/ActionEditor";
import DatasourceSelector from "./DatasourceSelector";
import {
  DocumentationButton,
  QueryFormContainer,
  SecondaryWrapper,
  SettingsWrapper,
  SidebarWrapper,
  TabContainerView,
  TabPanelWrapper,
  TabsListWrapper,
  Wrapper,
} from "./EditorJSONtoFormStyles";
import FormRender from "./FormRender";
import QueryDebuggerTabs from "./QueryDebuggerTabs";
import { QueryEditorContext } from "./QueryEditorContext";
import QueryEditorHeader from "./QueryEditorHeader";
import QueryResponseTab from "./QueryResponseTab";

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

  const {
    actionRightPaneAdditionSections,
    actionRightPaneBackLink,
    closeEditorLink,
    notification,
  } = useContext(QueryEditorContext);

  const params = useParams<{ apiId?: string; queryId?: string }>();
  // fetch the error count from the store.
  const actions: Action[] = useSelector((state: AppState) =>
    state.entities.actions.map((action) => action.config),
  );
  const currentActionConfig: Action | undefined = actions.find(
    (action) => action.id === params.apiId || action.id === params.queryId,
  );

  const pluginRequireDatasource = doesPluginRequireDatasource(plugin);

  const showSchema =
    useShowSchema(currentActionConfig?.pluginId || "") &&
    pluginRequireDatasource;

  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  const showRightPane = Boolean(actionRightPaneAdditionSections);

  // get the current action's plugin name
  const currentActionPluginName = useSelector((state: AppState) =>
    getPluginNameFromId(state, currentActionConfig?.pluginId || ""),
  );

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

  const { hasDependencies } = useEntityDependencies(props.actionName);

  const selectedConfigTab = useSelector(getQueryPaneConfigSelectedTabIndex);

  const setSelectedConfigTab = useCallback((selectedIndex: string) => {
    dispatch(setQueryPaneConfigSelectedTabIndex(selectedIndex));
  }, []);

  // here we check for normal conditions for opening action pane
  // or if any of the flags are true, We should open the actionpane by default.
  const shouldOpenActionPaneByDefault =
    hasDependencies ||
    !!actionResponse ||
    currentActionPluginName !== PluginName.SMTP;

  // when switching between different redux forms, make sure this redux form has been initialized before rendering anything.
  // the initialized prop below comes from redux-form.
  if (!props.initialized) {
    return null;
  }

  if (isActionRedesignEnabled && plugin) {
    const responseTabs = [];
    if (currentActionConfig) {
      responseTabs.push({
        key: "response",
        title: "Response",
        panelComponent: (
          <QueryResponseTab
            actionSource={actionSource}
            currentActionConfig={currentActionConfig}
            isRunning={isRunning}
            onRunClick={onRunClick}
            runErrorMessage={runErrorMessage}
          />
        ),
      });
    }
    return (
      <ActionEditor
        isRunning={isRunning}
        onDocsClick={handleDocumentationClick}
        onRunClick={onRunClick}
        runOptionsSelector={
          <DatasourceSelector
            currentActionConfig={currentActionConfig}
            dataSources={dataSources}
            formName={formName}
            onCreateDatasourceClick={onCreateDatasourceClick}
            plugin={plugin}
          />
        }
        settingsRender={
          <SettingsWrapper>
            <ActionSettings
              actionSettingsConfig={settingConfig}
              formName={formName}
            />
          </SettingsWrapper>
        }
        tabs={responseTabs}
      >
        <FormRender
          editorConfig={editorConfig}
          formData={props.formData}
          formEvaluationState={props.formEvaluationState}
          formName={formName}
          uiComponent={uiComponent}
        />
      </ActionEditor>
    );
  }

  return (
    <>
      {closeEditorLink}
      <QueryFormContainer onSubmit={handleSubmit(noop)}>
        <QueryEditorHeader
          dataSources={dataSources}
          formName={formName}
          isRunning={isRunning}
          onCreateDatasourceClick={onCreateDatasourceClick}
          onRunClick={onRunClick}
          plugin={plugin}
        />
        {notification}
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
                isRunning={isRunning}
                onRunClick={onRunClick}
                runErrorMessage={runErrorMessage}
                showSchema={showSchema}
              />
            </SecondaryWrapper>
          </div>
          {showRightPane && (
            <SidebarWrapper show={shouldOpenActionPaneByDefault}>
              <ActionRightPane
                actionRightPaneBackLink={actionRightPaneBackLink}
                additionalSections={actionRightPaneAdditionSections}
              />
            </SidebarWrapper>
          )}
        </Wrapper>
      </QueryFormContainer>
    </>
  );
}
