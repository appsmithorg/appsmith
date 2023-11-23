import React from "react";
import type { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import { getFormValues } from "redux-form";
import styled from "styled-components";
import type { QueryEditorRouteParams } from "constants/routes";
import QueryEditorForm from "./Form";
import type { UpdateActionPropertyActionPayload } from "actions/pluginActionActions";
import {
  deleteAction,
  runAction,
  setActionResponseDisplayFormat,
  setActionProperty,
} from "actions/pluginActionActions";
import type { AppState } from "@appsmith/reducers";
import { getCurrentApplicationId } from "selectors/editorSelectors";
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
import type { QueryAction, SaaSAction } from "entities/Action";
import Spinner from "components/editorComponents/Spinner";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { initFormEvaluations } from "actions/evaluationActions";
import { getUIComponent } from "./helpers";
import type { Diff } from "deep-diff";
import { diff } from "deep-diff";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import { getConfigInitialValues } from "components/formControls/utils";
import { merge } from "lodash";
import { getPathAndValueFromActionDiffObject } from "../../../utils/getPathAndValueFromActionDiffObject";
import { getCurrentEnvironmentDetails } from "@appsmith/selectors/environmentSelectors";
import { QueryEditorContext } from "./QueryEditorContext";

const EmptyStateContainer = styled.div`
  display: flex;
  height: 100%;
  font-size: 20px;
`;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

interface ReduxDispatchProps {
  runAction: (actionId: string) => void;
  deleteAction: (id: string, name: string) => void;
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
}

interface ReduxStateProps {
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
  uiComponent: UIComponentTypes;
  applicationId: string;
  actionId: string;
  actionObjectDiff?: any;
  isSaas: boolean;
  datasourceId?: string;
  currentEnvironmentId: string;
  currentEnvironmentName: string;
}

type StateAndRouteProps = RouteComponentProps<QueryEditorRouteParams>;
type OwnProps = StateAndRouteProps & {
  isEditorInitialized: boolean;
  settingsConfig: any;
};
type Props = ReduxDispatchProps & ReduxStateProps & OwnProps;

class QueryEditor extends React.Component<Props> {
  static contextType = QueryEditorContext;
  context!: React.ContextType<typeof QueryEditorContext>;

  constructor(props: Props) {
    super(props);
    // Call the first evaluations when the page loads
    // call evaluations only for queries and not google sheets (which uses apiId)
    if (this.props.match.params.queryId) {
      this.props.initFormEvaluation(
        this.props.editorConfig,
        this.props.settingsConfig,
        this.props.match.params.queryId,
      );
    }
  }

  componentDidMount() {
    // if the current action is non existent, do not dispatch change query page action
    // this action should only be dispatched when switching from an existent action.
    if (!this.props.pluginId) return;
    this.context?.changeQueryPage?.(this.props.actionId);

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
      this.context?.changeQueryPage?.(this.props.actionId);
    }
  }

  render() {
    const {
      actionId,
      dataSources,
      editorConfig,
      isCreating,
      isDeleting,
      isEditorInitialized,
      isRunning,
      pluginId,
      pluginIds,
      responses,
      runErrorMessage,
      uiComponent,
      updateActionResponseDisplayFormat,
    } = this.props;
    const { onCreateDatasourceClick, onEntityNotFoundBackClick } = this.context;

    // if the action can not be found, generate a entity not found page
    if (!pluginId && actionId) {
      return <EntityNotFoundPane goBackFn={onEntityNotFoundBackClick} />;
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
        location={this.props.location}
        onCreateDatasourceClick={onCreateDatasourceClick}
        onDeleteClick={this.handleDeleteClick}
        onRunClick={this.handleRunClick}
        pluginId={this.props.pluginId}
        runErrorMessage={runErrorMessage[actionId]}
        settingConfig={this.props.settingsConfig}
        uiComponent={uiComponent}
        updateActionResponseDisplayFormat={updateActionResponseDisplayFormat}
      />
    );
  }
}

const mapStateToProps = (state: AppState, props: OwnProps): ReduxStateProps => {
  const { apiId, queryId } = props.match.params;
  const actionId = queryId || apiId || "";
  const { runErrorMessage } = state.ui.queryPane;
  const { plugins } = state.entities;

  const { editorConfigs } = plugins;

  const action = getAction(state, actionId) as QueryAction | SaaSAction;
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

  const initialValues = {};

  if (editorConfig) {
    merge(initialValues, getConfigInitialValues(editorConfig));
  }

  if (props.settingsConfig) {
    merge(initialValues, getConfigInitialValues(props.settingsConfig));
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
    dataSources: !!apiId
      ? getDatasourceByPluginId(state, action?.pluginId)
      : getDBAndRemoteDatasources(state),
    responses: getActionResponses(state),
    isRunning: state.ui.queryPane.isRunning[actionId],
    isDeleting: state.ui.queryPane.isDeleting[actionId],
    isSaas: !!apiId,
    formData,
    editorConfig,
    isCreating: state.ui.apiPane.isCreating,
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
