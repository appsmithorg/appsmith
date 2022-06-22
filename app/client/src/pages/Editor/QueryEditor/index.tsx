import React from "react";
import { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import { getFormValues } from "redux-form";
import styled from "styled-components";
import { INTEGRATION_TABS, QueryEditorRouteParams } from "constants/routes";
import history from "utils/history";
import QueryEditorForm from "./Form";
import {
  deleteAction,
  runAction,
  setActionResponseDisplayFormat,
  UpdateActionPropertyActionPayload,
  setActionProperty,
} from "actions/pluginActionActions";
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
  getAction,
  getActionResponses,
  getDatasourceByPluginId,
  getDBAndRemoteDatasources,
} from "selectors/entitiesSelector";
import { PLUGIN_PACKAGE_DBS } from "constants/QueryEditorConstants";
import { QueryAction, QueryActionConfig, SaaSAction } from "entities/Action";
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
import { diff, Diff } from "deep-diff";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import { integrationEditorURL } from "RouteBuilder";
import { getConfigInitialValues } from "components/formControls/utils";
import { isArray, merge } from "lodash";
import { getPathAndValueFromActionDiffObject } from "../../../utils/getPathAndValueFromActionDiffObject";

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
  runFormEvaluation: (
    formId: string,
    formData: QueryActionConfig,
    datasourceId: string,
    pluginId: string,
    actionDiffPath?: string,
    hasRouteChanged?: boolean,
  ) => void;
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
};

type StateAndRouteProps = RouteComponentProps<QueryEditorRouteParams>;

type Props = StateAndRouteProps & ReduxDispatchProps & ReduxStateProps;

class QueryEditor extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    // Call the first evaluations when the page loads
    // call evaluations only for queries and not google sheets (which uses apiId)
    if (this.props.match.params.queryId) {
      this.props.initFormEvaluation(
        this.props.editorConfig,
        this.props.settingConfig,
        this.props.match.params.queryId,
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
    PerformanceTracker.startTracking(
      PerformanceTransactionName.RUN_QUERY_CLICK,
      { actionId: this.props.actionId },
    );
    AnalyticsUtil.logEvent("RUN_QUERY_CLICK", {
      actionId: this.props.actionId,
      dataSourceSize: dataSources.length,
    });
    this.props.runAction(this.props.actionId);
  };

  componentDidUpdate(prevProps: Props) {
    if (prevProps.isRunning === true && this.props.isRunning === false) {
      PerformanceTracker.stopTracking(
        PerformanceTransactionName.RUN_QUERY_CLICK,
      );
    }

    const formDataDiff = diff(prevProps.formData, this.props.formData);

    // actionDiffPath is the path of the form input which was changed by the user.
    let actionDiffPath = "";
    // hasRouteChanged tells us if the redux form state has changed (this usually happens when we route to another action.)
    let hasRouteChanged = false;

    // we compare the id of the formData, if the id's don't match, the formData has been changed, hence the route has changed.
    if (prevProps?.formData?.id !== this.props?.formData?.id) {
      hasRouteChanged = true;
    }

    if (
      formDataDiff &&
      !!formDataDiff[0] &&
      "path" in formDataDiff[0] &&
      isArray(formDataDiff[0].path)
    ) {
      actionDiffPath = formDataDiff[0].path.join(".");
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
    // If statement to debounce and track changes in the formData to update evaluations
    if (
      this.props.uiComponent === UIComponentTypes.UQIDbEditorForm &&
      !!this.props.formData &&
      (!prevProps.formData ||
        (this.props.formData.hasOwnProperty("actionConfiguration") &&
          !!prevProps.formData &&
          prevProps.formData.hasOwnProperty("actionConfiguration") &&
          !!formDataDiff))
    ) {
      this.props.runFormEvaluation(
        this.props.formData.id,
        this.props.formData.actionConfiguration,
        this.props.formData.datasource.id,
        this.props.formData.pluginId,
        actionDiffPath,
        hasRouteChanged,
      );
    }
  }

  onCreateDatasourceClick = () => {
    const { pageId } = this.props.match.params;
    history.push(
      integrationEditorURL({
        pageId,
        selectedTab: INTEGRATION_TABS.NEW,
      }),
    );
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
      pluginId,
      pluginIds,
      responses,
      runErrorMessage,
      settingConfig,
      uiComponent,
      updateActionResponseDisplayFormat,
    } = this.props;
    const { pageId } = this.props.match.params;

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
        editorConfig={editorConfig}
        executedQueryData={responses[actionId]}
        formData={this.props.formData}
        isDeleting={isDeleting}
        isRunning={isRunning}
        location={this.props.location}
        onCreateDatasourceClick={this.onCreateDatasourceClick}
        onDeleteClick={this.handleDeleteClick}
        onRunClick={this.handleRunClick}
        runErrorMessage={runErrorMessage[actionId]}
        settingConfig={settingConfig}
        uiComponent={uiComponent}
        updateActionResponseDisplayFormat={updateActionResponseDisplayFormat}
      />
    );
  }
}

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const { apiId, queryId } = props.match.params;
  const actionId = queryId || apiId;
  const { runErrorMessage } = state.ui.queryPane;
  const { plugins } = state.entities;

  const { editorConfigs, settingConfigs } = plugins;

  const action = getAction(state, actionId) as QueryAction | SaaSAction;
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

  const formData = getFormValues(QUERY_EDITOR_FORM_NAME)(state) as
    | QueryAction
    | SaaSAction;

  return {
    actionId,
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
    settingConfig,
    isCreating: state.ui.apiPane.isCreating,
    isEditorInitialized: getIsEditorInitialized(state),
    uiComponent,
    applicationId: getCurrentApplicationId(state),
    actionObjectDiff,
  };
};

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  deleteAction: (id: string, name: string) =>
    dispatch(deleteAction({ id, name })),
  runAction: (actionId: string) => dispatch(runAction(actionId)),
  changeQueryPage: (queryId: string) => {
    dispatch(changeQuery(queryId));
  },
  runFormEvaluation: (
    formId: string,
    formData: QueryActionConfig,
    datasourceId: string,
    pluginId: string,
    actionDiffPath?: string,
    hasRouteChanged?: boolean,
  ) => {
    dispatch(
      startFormEvaluations(
        formId,
        formData,
        datasourceId,
        pluginId,
        actionDiffPath,
        hasRouteChanged,
      ),
    );
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
