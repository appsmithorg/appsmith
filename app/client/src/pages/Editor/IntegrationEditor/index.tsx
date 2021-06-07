import React from "react";
import { connect } from "react-redux";
import { submit } from "redux-form";
// import ApiEditorForm from "./Form";
// import RapidApiEditorForm from "./RapidApiEditorForm";
import ApiHomeScreen from "./ApiHomeScreen";
import { deleteAction, runActionInit } from "actions/actionActions";
import { PaginationField } from "api/ActionAPI";
import { AppState } from "reducers";
import { RouteComponentProps } from "react-router";
import {
  ActionData,
  ActionDataState,
} from "reducers/entityReducers/actionsReducer";
// import { REST_PLUGIN_PACKAGE_NAME } from "constants/ApiEditorConstants";
import _ from "lodash";
import { getCurrentApplication } from "selectors/applicationSelectors";
// import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  getActionById,
  getCurrentPageName,
  getIsEditorInitialized,
} from "selectors/editorSelectors";
import { Plugin } from "api/PluginApi";
import { Action, PaginationType, RapidApiAction } from "entities/Action";
import { getApiName } from "selectors/formSelectors";
import Spinner from "components/editorComponents/Spinner";
import styled from "styled-components";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { changeApi } from "actions/apiPaneActions";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as Sentry from "@sentry/react";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import { ApplicationPayload } from "constants/ReduxActionConstants";
import { getPluginSettingConfigs } from "selectors/entitiesSelector";
// import { SAAS_EDITOR_API_ID_URL } from "../SaaSEditor/constants";
// import history from "utils/history";

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

interface ReduxStateProps {
  actions: ActionDataState;
  isRunning: boolean;
  isDeleting: boolean;
  isCreating: boolean;
  apiName: string;
  currentApplication?: ApplicationPayload;
  currentPageName: string | undefined;
  pages: any;
  plugins: Plugin[];
  pluginId: any;
  settingsConfig: any;
  apiAction: Action | ActionData | RapidApiAction | undefined;
  paginationType: PaginationType;
  isEditorInitialized: boolean;
}
interface ReduxActionProps {
  submitForm: (name: string) => void;
  runAction: (id: string, paginationField?: PaginationField) => void;
  deleteAction: (id: string, name: string) => void;
  changeAPIPage: (apiId: string, isSaas: boolean) => void;
}

type Props = ReduxActionProps &
  ReduxStateProps &
  RouteComponentProps<{ apiId: string; applicationId: string; pageId: string }>;

class ApiEditor extends React.Component<Props> {
  componentDidMount() {
    PerformanceTracker.stopTracking(PerformanceTransactionName.OPEN_ACTION, {
      actionType: "API",
    });
    console.log("this is integrations");
    // const type = this.getFormName();
    // this.props.changeAPIPage(this.props.match.params.apiId, type === "SAAS");
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.isRunning && !this.props.isRunning) {
      PerformanceTracker.stopTracking(PerformanceTransactionName.RUN_API_CLICK);
    }
  }

  render() {
    const {
      isCreating,
      // isDeleting,
      isEditorInitialized,
      // isRunning,
      // match: {
      //   params: { apiId },
      // },
      // paginationType,
      // pluginId,
      // plugins,
    } = this.props;
    if (!this.props.pluginId && this.props.match.params.apiId) {
      return <EntityNotFoundPane />;
    }
    if (isCreating || !isEditorInitialized) {
      return (
        <LoadingContainer>
          <Spinner size={30} />
        </LoadingContainer>
      );
    }

    return (
      <div
        style={{
          position: "relative",
          height: "100%",
        }}
      >
        <ApiHomeScreen
          applicationId={this.props.match.params.applicationId}
          history={this.props.history}
          location={this.props.location}
          match={this.props.match}
          pageId={this.props.match.params.pageId}
        />
      </div>
    );
  }
}

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const apiAction = getActionById(state, props);
  const apiName = getApiName(state, props.match.params.apiId);
  console.log({ apiName });
  const { isCreating, isDeleting, isRunning } = state.ui.apiPane;
  const pluginId = _.get(apiAction, "pluginId", "");
  const settingsConfig = getPluginSettingConfigs(state, pluginId);
  return {
    actions: state.entities.actions,
    currentApplication: getCurrentApplication(state),
    currentPageName: getCurrentPageName(state),
    pages: state.entities.pageList.pages,
    apiName: apiName || "",
    plugins: state.entities.plugins.list,
    pluginId,
    settingsConfig,
    paginationType: _.get(apiAction, "actionConfiguration.paginationType"),
    apiAction,
    isRunning: isRunning[props.match.params.apiId],
    isDeleting: isDeleting[props.match.params.apiId],
    isCreating: isCreating,
    isEditorInitialized: getIsEditorInitialized(state),
  };
};

const mapDispatchToProps = (dispatch: any): ReduxActionProps => ({
  submitForm: (name: string) => dispatch(submit(name)),
  runAction: (id: string, paginationField?: PaginationField) =>
    dispatch(runActionInit(id, paginationField)),
  deleteAction: (id: string, name: string) =>
    dispatch(deleteAction({ id, name })),
  changeAPIPage: (actionId: string, isSaas: boolean) =>
    dispatch(changeApi(actionId, isSaas)),
});

export default Sentry.withProfiler(
  connect(mapStateToProps, mapDispatchToProps)(ApiEditor),
);
