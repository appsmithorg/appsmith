import React from "react";
import { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import { getFormValues } from "redux-form";
import styled from "styled-components";
import {
  INTEGRATION_EDITOR_URL,
  INTEGRATION_TABS,
  QueryEditorRouteParams,
} from "constants/routes";
import history from "utils/history";
import QueryEditorForm from "./Form";
import { deleteAction, runAction } from "actions/pluginActionActions";
import { AppState } from "reducers";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
} from "selectors/editorSelectors";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { Plugin, UIComponentTypes } from "api/PluginApi";
import { Datasource } from "entities/Datasource";
import {
  getPluginIdsOfPackageNames,
  getPlugins,
  getPluginImages,
  getAction,
  getActionResponses,
  getDBAndRemoteDatasources,
} from "selectors/entitiesSelector";
import { PLUGIN_PACKAGE_DBS } from "constants/QueryEditorConstants";
import { QueryAction, QueryActionConfig } from "entities/Action";
import Spinner from "components/editorComponents/Spinner";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { changeQuery } from "actions/queryPaneActions";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  initFormEvaluations,
  startFormEvaluations,
} from "actions/evaluationActions";
import { getUIComponent } from "./helpers";
import { diff } from "deep-diff";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";

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
  runFormEvaluation: (formId: string, formData: QueryActionConfig) => void;
  initFormEvaluation: (
    editorConfig: any,
    settingConfig: any,
    formId: string,
  ) => void;
};

type ReduxStateProps = {
  plugins: Plugin[];
  dataSources: Datasource[];
  isRunning: boolean;
  isDeleting: boolean;
  formData: QueryAction;
  runErrorMessage: Record<string, string>;
  pluginId: string | undefined;
  pluginIds: Array<string> | undefined;
  responses: any;
  isCreating: boolean;
  pluginImages: Record<string, string>;
  editorConfig: any;
  settingConfig: any;
  isEditorInitialized: boolean;
  uiComponent: UIComponentTypes;
  applicationId: string;
};

type StateAndRouteProps = RouteComponentProps<QueryEditorRouteParams>;

type Props = StateAndRouteProps & ReduxDispatchProps & ReduxStateProps;

class QueryEditor extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    // Call the first evaluations when the page loads
    this.props.initFormEvaluation(
      this.props.editorConfig,
      this.props.settingConfig,
      this.props.match.params.queryId,
    );
  }

  componentDidMount() {
    // if the current action is non existent, do not dispatch change query page action
    // this action should only be dispatched when switching from an existent action.
    if (!this.props.pluginId) return;
    this.props.changeQueryPage(this.props.match.params.queryId);

    PerformanceTracker.stopTracking(PerformanceTransactionName.OPEN_ACTION, {
      actionType: "QUERY",
    });
  }
  handleDeleteClick = () => {
    const { queryId } = this.props.match.params;
    const { formData } = this.props;
    this.props.deleteAction(queryId, formData.name);
  };

  handleRunClick = () => {
    const { dataSources, match } = this.props;
    PerformanceTracker.startTracking(
      PerformanceTransactionName.RUN_QUERY_CLICK,
      { queryId: this.props.match.params.queryId },
    );
    AnalyticsUtil.logEvent("RUN_QUERY_CLICK", {
      queryId: this.props.match.params.queryId,
      dataSourceSize: dataSources.length,
    });
    this.props.runAction(match.params.queryId);
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
      prevProps.match.params.queryId !== this.props.match.params.queryId ||
      prevProps.pluginId !== this.props.pluginId
    ) {
      this.props.changeQueryPage(this.props.match.params.queryId);
    }
    // If statement to debounce and track changes in the formData to update evaluations
    if (
      this.props.uiComponent === UIComponentTypes.UQIDbEditorForm &&
      !!this.props.formData &&
      (!prevProps.formData ||
        (this.props.formData.hasOwnProperty("actionConfiguration") &&
          !!prevProps.formData &&
          prevProps.formData.hasOwnProperty("actionConfiguration") &&
          !!diff(prevProps.formData, this.props.formData)))
    ) {
      this.props.runFormEvaluation(
        this.props.formData.id,
        this.props.formData.actionConfiguration,
      );
    }
  }

  render() {
    const {
      applicationId,
      dataSources,
      editorConfig,
      isCreating,
      isDeleting,
      isEditorInitialized,
      isRunning,
      match: {
        params: { queryId },
      },
      pluginId,
      pluginIds,
      pluginImages,
      responses,
      runErrorMessage,
      settingConfig,
      uiComponent,
    } = this.props;
    const { pageId } = this.props.match.params;

    // custom function to return user to integrations page if action is not found
    const goToDatasourcePage = () =>
      history.push(
        INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.ACTIVE),
      );

    // if the action can not be found, generate a entity not found page
    if (!pluginId && queryId) {
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

    const DATASOURCES_OPTIONS = dataSources.map((dataSource) => ({
      label: dataSource.name,
      value: dataSource.id,
      image: pluginImages[dataSource.pluginId],
    }));

    const onCreateDatasourceClick = () => {
      history.push(
        INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.NEW),
      );
    };
    return (
      <QueryEditorForm
        DATASOURCES_OPTIONS={DATASOURCES_OPTIONS}
        dataSources={dataSources}
        editorConfig={editorConfig}
        executedQueryData={responses[queryId]}
        isDeleting={isDeleting}
        isRunning={isRunning}
        location={this.props.location}
        onCreateDatasourceClick={onCreateDatasourceClick}
        onDeleteClick={this.handleDeleteClick}
        onRunClick={this.handleRunClick}
        runErrorMessage={runErrorMessage[queryId]}
        settingConfig={settingConfig}
        uiComponent={uiComponent}
      />
    );
  }
}

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const { runErrorMessage } = state.ui.queryPane;
  const { plugins } = state.entities;

  const { editorConfigs, settingConfigs } = plugins;
  const formData = getFormValues(QUERY_EDITOR_FORM_NAME)(state) as QueryAction;
  const queryAction = getAction(
    state,
    props.match.params.queryId,
  ) as QueryAction;
  let pluginId;
  if (queryAction) {
    pluginId = queryAction.pluginId;
  }
  let editorConfig: any;

  if (editorConfigs && pluginId) {
    editorConfig = editorConfigs[pluginId];
  }

  let settingConfig: any;

  if (settingConfigs && pluginId) {
    settingConfig = settingConfigs[pluginId];
  }

  const allPlugins = getPlugins(state);
  let uiComponent = UIComponentTypes.DbEditorForm;
  if (!!pluginId) uiComponent = getUIComponent(pluginId, allPlugins);

  return {
    pluginImages: getPluginImages(state),
    pluginId,
    plugins: allPlugins,
    runErrorMessage,
    pluginIds: getPluginIdsOfPackageNames(state, PLUGIN_PACKAGE_DBS),
    dataSources: getDBAndRemoteDatasources(state),
    responses: getActionResponses(state),
    isRunning: state.ui.queryPane.isRunning[props.match.params.queryId],
    isDeleting: state.ui.queryPane.isDeleting[props.match.params.queryId],
    formData,
    editorConfig,
    settingConfig,
    isCreating: state.ui.apiPane.isCreating,
    isEditorInitialized: getIsEditorInitialized(state),
    uiComponent,
    applicationId: getCurrentApplicationId(state),
  };
};

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  deleteAction: (id: string, name: string) =>
    dispatch(deleteAction({ id, name })),
  runAction: (actionId: string) => dispatch(runAction(actionId)),
  changeQueryPage: (queryId: string) => {
    dispatch(changeQuery(queryId));
  },
  runFormEvaluation: (formId: string, formData: QueryActionConfig) => {
    dispatch(startFormEvaluations(formId, formData));
  },
  initFormEvaluation: (
    editorConfig: any,
    settingsConfig: any,
    formId: string,
  ) => {
    dispatch(initFormEvaluations(editorConfig, settingsConfig, formId));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(QueryEditor);
