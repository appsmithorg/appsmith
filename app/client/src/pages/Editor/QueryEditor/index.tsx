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
import { deleteAction, runActionInit } from "actions/actionActions";
import { AppState } from "reducers";
import { getIsEditorInitialized } from "selectors/editorSelectors";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { Plugin } from "api/PluginApi";
import { Datasource } from "entities/Datasource";
import {
  getPluginIdsOfPackageNames,
  getPlugins,
  getPluginImages,
  getDBDatasources,
  getAction,
  getActionResponses,
} from "selectors/entitiesSelector";
import { PLUGIN_PACKAGE_DBS } from "constants/QueryEditorConstants";
import { QueryAction } from "entities/Action";
import Spinner from "components/editorComponents/Spinner";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { changeQuery } from "actions/queryPaneActions";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import AnalyticsUtil from "utils/AnalyticsUtil";

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
};

type ReduxStateProps = {
  plugins: Plugin[];
  dataSources: Datasource[];
  isRunning: boolean;
  isDeleting: boolean;
  formData: QueryAction;
  runErrorMessage: Record<string, string>;
  pluginIds: Array<string> | undefined;
  responses: any;
  isCreating: boolean;
  pluginImages: Record<string, string>;
  editorConfig: any;
  settingConfig: any;
  isEditorInitialized: boolean;
};

type StateAndRouteProps = RouteComponentProps<QueryEditorRouteParams>;

type Props = StateAndRouteProps & ReduxDispatchProps & ReduxStateProps;

class QueryEditor extends React.Component<Props> {
  componentDidMount() {
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
    if (prevProps.match.params.queryId !== this.props.match.params.queryId) {
      this.props.changeQueryPage(this.props.match.params.queryId);
    }
  }

  render() {
    const {
      dataSources,
      editorConfig,
      isCreating,
      isDeleting,
      isEditorInitialized,
      isRunning,
      match: {
        params: { queryId },
      },
      pluginIds,
      pluginImages,
      responses,
      runErrorMessage,
      settingConfig,
    } = this.props;
    const { applicationId, pageId } = this.props.match.params;

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

  return {
    pluginImages: getPluginImages(state),
    plugins: getPlugins(state),
    runErrorMessage,
    pluginIds: getPluginIdsOfPackageNames(state, PLUGIN_PACKAGE_DBS),
    dataSources: getDBDatasources(state),
    responses: getActionResponses(state),
    isRunning: state.ui.queryPane.isRunning[props.match.params.queryId],
    isDeleting: state.ui.queryPane.isDeleting[props.match.params.queryId],
    formData,
    editorConfig,
    settingConfig,
    isCreating: state.ui.apiPane.isCreating,
    isEditorInitialized: getIsEditorInitialized(state),
  };
};

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  deleteAction: (id: string, name: string) =>
    dispatch(deleteAction({ id, name })),
  runAction: (actionId: string) => dispatch(runActionInit(actionId)),
  changeQueryPage: (queryId: string) => {
    dispatch(changeQuery(queryId));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(QueryEditor);
