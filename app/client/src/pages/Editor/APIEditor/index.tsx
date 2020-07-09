import React from "react";
import { connect } from "react-redux";
import { submit } from "redux-form";
import ApiEditorForm from "./Form";
import RapidApiEditorForm from "./RapidApiEditorForm";
import ApiHomeScreen from "./ApiHomeScreen";
import { runAction, deleteAction } from "actions/actionActions";
import { PaginationField } from "api/ActionAPI";
import { AppState } from "reducers";
import { RouteComponentProps } from "react-router";
import {
  ActionData,
  ActionDataState,
} from "reducers/entityReducers/actionsReducer";
import { REST_PLUGIN_PACKAGE_NAME } from "constants/ApiEditorConstants";
import _ from "lodash";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { UserApplication } from "constants/userConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getActionById, getCurrentPageName } from "selectors/editorSelectors";
import { Plugin } from "api/PluginApi";
import { RapidApiAction, RestAction, PaginationType } from "entities/Action";
import { getApiName } from "selectors/formSelectors";
import Spinner from "components/editorComponents/Spinner";
import styled from "styled-components";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { changeApi, initApiPane } from "actions/apiPaneActions";

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

interface ReduxStateProps {
  actions: ActionDataState;
  isRunning: Record<string, boolean>;
  isDeleting: Record<string, boolean>;
  isCreating: boolean;
  isMoving: boolean;
  isCopying: boolean;
  apiName: string;
  currentApplication: UserApplication;
  currentPageName: string | undefined;
  pages: any;
  plugins: Plugin[];
  pluginId: any;
  apiAction: RestAction | ActionData | RapidApiAction | undefined;
  paginationType: PaginationType;
}
interface ReduxActionProps {
  submitForm: (name: string) => void;
  runAction: (id: string, paginationField?: PaginationField) => void;
  deleteAction: (id: string, name: string) => void;
  changeAPIPage: (apiId: string) => void;
  initApiPane: (apiId: string) => void;
}

function getPageName(pages: any, pageId: string) {
  const page = pages.find((page: any) => page.pageId === pageId);
  return page ? page.pageName : "";
}

type Props = ReduxActionProps &
  ReduxStateProps &
  RouteComponentProps<{ apiId: string; applicationId: string; pageId: string }>;

class ApiEditor extends React.Component<Props> {
  componentDidMount() {
    this.props.initApiPane(this.props.match.params.apiId);
  }
  handleDeleteClick = () => {
    const pageName = getPageName(
      this.props.pages,
      this.props.match.params.pageId,
    );
    AnalyticsUtil.logEvent("DELETE_API_CLICK", {
      apiName: this.props.apiName,
      apiID: this.props.match.params.apiId,
      pageName: pageName,
    });
    this.props.deleteAction(this.props.match.params.apiId, this.props.apiName);
  };

  componentDidUpdate(prevProps: Props) {
    if (prevProps.match.params.apiId !== this.props.match.params.apiId) {
      this.props.changeAPIPage(this.props.match.params.apiId);
    }
  }

  handleRunClick = (paginationField?: PaginationField) => {
    const pageName = getPageName(
      this.props.pages,
      this.props.match.params.pageId,
    );
    AnalyticsUtil.logEvent("RUN_API_CLICK", {
      apiName: this.props.apiName,
      apiID: this.props.match.params.apiId,
      pageName: pageName,
    });
    this.props.runAction(this.props.match.params.apiId, paginationField);
  };

  getPluginUiComponentOfId = (
    id: string,
    plugins: Plugin[],
  ): string | undefined => {
    const plugin = plugins.find(plugin => plugin.id === id);
    if (!plugin) return undefined;
    return plugin.uiComponent;
  };

  getPluginUiComponentOfName = (plugins: Plugin[]): string | undefined => {
    const plugin = plugins.find(
      plugin => plugin.packageName === REST_PLUGIN_PACKAGE_NAME,
    );
    if (!plugin) return undefined;
    return plugin.uiComponent;
  };

  render() {
    const {
      match: {
        params: { apiId },
      },
      plugins,
      pluginId,
      isRunning,
      isDeleting,
      isCreating,
      isCopying,
      isMoving,
      paginationType,
    } = this.props;
    if (isCreating || isCopying || isMoving) {
      return (
        <LoadingContainer>
          <Spinner size={30} />
        </LoadingContainer>
      );
    }

    let formUiComponent: string | undefined;
    if (apiId) {
      if (pluginId) {
        formUiComponent = this.getPluginUiComponentOfId(pluginId, plugins);
      } else {
        formUiComponent = this.getPluginUiComponentOfName(plugins);
      }
    }

    const apiHomeScreen = (
      <ApiHomeScreen
        applicationId={this.props.match.params.applicationId}
        pageId={this.props.match.params.pageId}
        history={this.props.history}
        location={this.props.location}
        match={this.props.match}
      />
    );

    return (
      <div
        style={{
          position: "relative",
          height: "100%",
        }}
      >
        {apiId ? (
          <>
            {formUiComponent === "ApiEditorForm" && (
              <ApiEditorForm
                pluginId={pluginId}
                paginationType={paginationType}
                isRunning={isRunning[apiId]}
                isDeleting={isDeleting[apiId]}
                onDeleteClick={this.handleDeleteClick}
                onRunClick={this.handleRunClick}
                appName={
                  this.props.currentApplication
                    ? this.props.currentApplication.name
                    : ""
                }
                apiName={this.props.apiName}
                location={this.props.location}
              />
            )}

            {formUiComponent === "RapidApiEditorForm" && (
              <RapidApiEditorForm
                apiName={this.props.apiName}
                apiId={this.props.match.params.apiId}
                paginationType={paginationType}
                isRunning={isRunning[apiId]}
                isDeleting={isDeleting[apiId]}
                onDeleteClick={this.handleDeleteClick}
                onRunClick={this.handleRunClick}
                appName={
                  this.props.currentApplication
                    ? this.props.currentApplication.name
                    : ""
                }
                location={this.props.location}
              />
            )}
          </>
        ) : (
          apiHomeScreen
        )}
      </div>
    );
  }
}

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const apiAction = getActionById(state, props);
  const apiName = getApiName(state, props.match.params.apiId);
  const {
    isDeleting,
    isRunning,
    isCreating,
    isMoving,
    isCopying,
  } = state.ui.apiPane;
  return {
    actions: state.entities.actions,
    currentApplication: getCurrentApplication(state),
    currentPageName: getCurrentPageName(state),
    pages: state.entities.pageList.pages,
    apiName: apiName || "",
    plugins: state.entities.plugins.list,
    pluginId: _.get(apiAction, "pluginId"),
    paginationType: _.get(apiAction, "actionConfiguration.paginationType"),
    apiAction,
    isRunning,
    isDeleting,
    isCreating,
    isMoving,
    isCopying,
  };
};

const mapDispatchToProps = (dispatch: any): ReduxActionProps => ({
  submitForm: (name: string) => dispatch(submit(name)),
  runAction: (id: string, paginationField?: PaginationField) =>
    dispatch(runAction(id, paginationField)),
  deleteAction: (id: string, name: string) =>
    dispatch(deleteAction({ id, name })),
  changeAPIPage: (actionId: string) => dispatch(changeApi(actionId)),
  initApiPane: (urlId?: string) => dispatch(initApiPane(urlId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ApiEditor);
