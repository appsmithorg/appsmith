import React from "react";
import { connect } from "react-redux";
import { getFormValues } from "redux-form";
import styled from "styled-components";
import { INTEGRATION_TABS } from "constants/routes";
import history from "utils/history";
import QueryEditorForm from "./Form";
import type { UpdateActionPropertyActionPayload } from "actions/pluginActionActions";
import {
  deleteAction,
  runAction,
  setActionResponseDisplayFormat,
  setActionProperty,
} from "actions/pluginActionActions";
import type { AppState } from "@appsmith/reducers";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
} from "selectors/editorSelectors";
import { QUERY_EDITOR_FORM_NAME } from "@appsmith/constants/forms";
import type { Plugin } from "api/PluginApi";
import { UIComponentTypes } from "api/PluginApi";
import type { Datasource } from "entities/Datasource";
import {
  getPluginIdsOfPackageNames,
  getPlugins,
  getAction,
  getActionResponses,
  getDatasourceByPluginId,
  getDBAndRemoteDatasources,
} from "@appsmith/selectors/entitiesSelector";
import { PLUGIN_PACKAGE_DBS } from "constants/QueryEditorConstants";
import type { Action, QueryAction, SaaSAction } from "entities/Action";
import { PluginType } from "entities/Action";
import Spinner from "components/editorComponents/Spinner";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { changeQuery } from "actions/queryPaneActions";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { initFormEvaluations } from "@appsmith/actions/evaluationActions";
import { getUIComponent } from "./helpers";
import type { Diff } from "deep-diff";
import { diff } from "deep-diff";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import { integrationEditorURL } from "RouteBuilder";
import { getConfigInitialValues } from "components/formControls/utils";
import { merge } from "lodash";
import { getPathAndValueFromActionDiffObject } from "../../../utils/getPathAndValueFromActionDiffObject";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import { getCurrentEnvironmentDetails } from "@appsmith/selectors/environmentSelectors";

const EmptyStateContainer = styled.div`
  display: flex;
  height: 100%;
  font-size: 20px;
`;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

type ReduxDispatchProps = {
  runAction: (actionId: string) => void;
  deleteAction: (id: string, name: string) => void;
  changeQueryPage: (queryId: string) => void;
  initFormEvaluation: (
    editorConfig: any,
    settingConfig: any,
    formId: string,
  ) => void;
  updateActionResponseDisplayFormat: ({
    field,
    id,
    value,
  }: UpdateActionPropertyActionPayload) => void;
  setActionProperty: (
    actionId: string,
    propertyName: string,
    value: string,
  ) => void;
};

type ReduxStateProps = {
  plugins: Plugin[];
  dataSources: Datasource[];
  isRunning: boolean;
  isDeleting: boolean;
  formData: QueryAction | SaaSAction;
  runErrorMessage: Record<string, string>;
  pluginId: string | undefined;
  pluginIds: Array<string> | undefined;
  responses: any;
  isCreating: boolean;
  editorConfig: any;
  settingConfig: any;
  isEditorInitialized: boolean;
  uiComponent: UIComponentTypes;
  applicationId: string;
  actionId: string;
  actionObjectDiff?: any;
  isSaas: boolean;
  datasourceId?: string;
  currentEnvironmentId: string;
  currentEnvironmentName: string;
};

type Props = ReduxDispatchProps &
  ReduxStateProps & { actionId: string; pageId: string };

class QueryEditor extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    // Call the first evaluations when the page loads
    // call evaluations only for queries and not google sheets (which uses apiId)
    const { actionId } = props;
    if (actionId) {
      this.props.initFormEvaluation(
        this.props.editorConfig,
        this.props.settingConfig,
        actionId,
      );
    }
  }

  componentDidMount() {
    // if the current action is non existent, do not dispatch change query page action
    // this action should only be dispatched when switching from an existent action.
    if (!this.props.pluginId) return;
    this.props.changeQueryPage(this.props.actionId);

    // fixes missing where key issue by populating the action with a where object when the component is mounted.
    if (this.props.isSaas) {
      const { path = "", value = "" } = {
        ...getPathAndValueFromActionDiffObject(this.props.actionObjectDiff),
      };
      if (value && path) {
        this.props.setActionProperty(this.props.actionId, path, value);
      }
    }

    PerformanceTracker.stopTracking(PerformanceTransactionName.OPEN_ACTION, {
      actionType: "QUERY",
    });
  }

  handleDeleteClick = () => {
    const { formData } = this.props;
    this.props.deleteAction(this.props.actionId, formData.name);
  };

  handleRunClick = () => {
    const { dataSources } = this.props;
    const datasource = dataSources.find(
      (datasource) => datasource.id === this.props.datasourceId,
    );
    const pluginName = this.props.plugins.find(
      (plugin) => plugin.id === this.props.pluginId,
    )?.name;
    PerformanceTracker.startTracking(
      PerformanceTransactionName.RUN_QUERY_CLICK,
      { actionId: this.props.actionId },
    );
    AnalyticsUtil.logEvent("RUN_QUERY_CLICK", {
      actionId: this.props.actionId,
      dataSourceSize: dataSources.length,
      environmentId: this.props.currentEnvironmentId,
      environmentName: this.props.currentEnvironmentName,
      pluginName: pluginName,
      datasourceId: datasource?.id,
      isMock: !!datasource?.isMock,
    });
    this.props.runAction(this.props.actionId);
  };

  componentDidUpdate(prevProps: Props) {
    if (prevProps.isRunning === true && this.props.isRunning === false) {
      PerformanceTracker.stopTracking(
        PerformanceTransactionName.RUN_QUERY_CLICK,
      );
    }
    // Update the page when the queryID is changed by changing the
    // URL or selecting new query from the query pane
    // reusing same logic for changing query panes for switching query editor datasources, since the operations are similar.
    if (
      prevProps.actionId !== this.props.actionId ||
      prevProps.pluginId !== this.props.pluginId
    ) {
      this.props.changeQueryPage(this.props.actionId);
    }
  }

  onCreateDatasourceClick = () => {
    history.push(
      integrationEditorURL({
        pageId: this.props.pageId,
        selectedTab: INTEGRATION_TABS.NEW,
      }),
    );
    // Event for datasource creation click
    const entryPoint = DatasourceCreateEntryPoints.QUERY_EDITOR;
    AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
      entryPoint,
    });
  };

  render() {
    const {
      actionId,
      dataSources,
      editorConfig,
      isCreating,
      isDeleting,
      isEditorInitialized,
      isRunning,
      pageId,
      pluginId,
      pluginIds,
      responses,
      runErrorMessage,
      settingConfig,
      uiComponent,
      updateActionResponseDisplayFormat,
    } = this.props;

    // custom function to return user to integrations page if action is not found
    const goToDatasourcePage = () =>
      history.push(
        integrationEditorURL({
          pageId,
          selectedTab: INTEGRATION_TABS.ACTIVE,
        }),
      );

    // if the action can not be found, generate a entity not found page
    if (!pluginId && actionId) {
      return <EntityNotFoundPane goBackFn={goToDatasourcePage} />;
    }

    if (!pluginIds?.length) {
      return (
        <EmptyStateContainer>{"Plugin is not installed"}</EmptyStateContainer>
      );
    }

    if (isCreating || !isEditorInitialized) {
      return (
        <LoadingContainer>
          <Spinner size={30} />
        </LoadingContainer>
      );
    }

    return (
      <QueryEditorForm
        dataSources={dataSources}
        datasourceId={this.props.datasourceId}
        editorConfig={editorConfig}
        executedQueryData={responses[actionId]}
        formData={this.props.formData}
        isDeleting={isDeleting}
        isRunning={isRunning}
        onCreateDatasourceClick={this.onCreateDatasourceClick}
        onDeleteClick={this.handleDeleteClick}
        onRunClick={this.handleRunClick}
        pluginId={this.props.pluginId}
        runErrorMessage={runErrorMessage[actionId]}
        settingConfig={settingConfig}
        uiComponent={uiComponent}
        updateActionResponseDisplayFormat={updateActionResponseDisplayFormat}
      />
    );
  }
}

const mapStateToProps = (
  state: AppState,
  props: { actionId: string },
): ReduxStateProps => {
  const { runErrorMessage } = state.ui.queryPane;
  const { plugins } = state.entities;
  const { actionId } = props;

  const { editorConfigs, settingConfigs } = plugins;

  const action = getAction(state, actionId) as Action | undefined;
  const formData = getFormValues(QUERY_EDITOR_FORM_NAME)(state) as
    | QueryAction
    | SaaSAction;
  let pluginId;
  if (action) {
    pluginId = action.pluginId;
  }

  let editorConfig: any;

  if (editorConfigs && pluginId) {
    editorConfig = editorConfigs[pluginId];
  }

  let settingConfig: any;

  if (settingConfigs && pluginId) {
    settingConfig = settingConfigs[pluginId];
  }

  const initialValues = {};

  if (editorConfig) {
    merge(initialValues, getConfigInitialValues(editorConfig));
  }

  if (settingConfig) {
    merge(initialValues, getConfigInitialValues(settingConfig));
  }

  // initialValues contains merge of action, editorConfig, settingsConfig and will be passed to redux form
  merge(initialValues, action);

  // @ts-expect-error: Types are not available
  const actionObjectDiff: undefined | Diff<Action | undefined, Action>[] = diff(
    action,
    initialValues,
  );

  const allPlugins = getPlugins(state);
  let uiComponent = UIComponentTypes.DbEditorForm;
  if (!!pluginId) uiComponent = getUIComponent(pluginId, allPlugins);

  const currentEnvDetails = getCurrentEnvironmentDetails(state);

  return {
    actionId,
    currentEnvironmentId: currentEnvDetails?.id || "",
    currentEnvironmentName: currentEnvDetails?.name || "",
    pluginId,
    plugins: allPlugins,
    runErrorMessage,
    pluginIds: getPluginIdsOfPackageNames(state, PLUGIN_PACKAGE_DBS),
    dataSources:
      action?.pluginType === PluginType.SAAS
        ? getDatasourceByPluginId(state, action?.pluginId)
        : getDBAndRemoteDatasources(state),
    responses: getActionResponses(state),
    isRunning: state.ui.queryPane.isRunning[actionId],
    isDeleting: state.ui.queryPane.isDeleting[actionId],
    isSaas: action?.pluginType === PluginType.SAAS,
    formData,
    editorConfig,
    settingConfig,
    isCreating: state.ui.apiPane.isCreating,
    isEditorInitialized: getIsEditorInitialized(state),
    uiComponent,
    applicationId: getCurrentApplicationId(state),
    actionObjectDiff,
    datasourceId: action?.datasource?.id,
  };
};

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  deleteAction: (id: string, name: string) =>
    dispatch(deleteAction({ id, name })),
  runAction: (actionId: string) => dispatch(runAction(actionId)),
  changeQueryPage: (queryId: string) => {
    dispatch(changeQuery(queryId));
  },
  initFormEvaluation: (
    editorConfig: any,
    settingsConfig: any,
    formId: string,
  ) => {
    dispatch(initFormEvaluations(editorConfig, settingsConfig, formId));
  },
  updateActionResponseDisplayFormat: ({
    field,
    id,
    value,
  }: UpdateActionPropertyActionPayload) => {
    dispatch(setActionResponseDisplayFormat({ id, field, value }));
  },
  setActionProperty: (
    actionId: string,
    propertyName: string,
    value: string,
  ) => {
    dispatch(setActionProperty({ actionId, propertyName, value }));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(QueryEditor);
