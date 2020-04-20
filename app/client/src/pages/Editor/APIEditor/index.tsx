import React from "react";
import { connect } from "react-redux";
import { submit, getFormValues } from "redux-form";
import ApiEditorForm from "./Form";
import RapidApiEditorForm from "./RapidApiEditorForm";
import ApiHomeScreen from "./ApiHomeScreen";
import {
  createActionRequest,
  runApiAction,
  deleteAction,
  updateAction,
} from "actions/actionActions";
import { RestAction, PaginationField, RapidApiAction } from "api/ActionAPI";
import { AppState } from "reducers";
import { RouteComponentProps } from "react-router";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { ApiPaneReduxState } from "reducers/uiReducers/apiPaneReducer";
import { REST_PLUGIN_PACKAGE_NAME } from "constants/ApiEditorConstants";
import _ from "lodash";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { UserApplication } from "constants/userConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentPageName, getActionById } from "selectors/editorSelectors";
import { Plugin } from "api/PluginApi";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { API_PANE_V2, checkForFlag } from "utils/featureFlags";
import styled from "styled-components";

const EmptyStateContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 20px;
`;

interface ReduxStateProps {
  actions: ActionDataState;
  apiPane: ApiPaneReduxState;
  formData: RestAction;
  currentApplication: UserApplication;
  currentPageName: string | undefined;
  pages: any;
  plugins: Plugin[];
  pluginId: any;
  apiAction: RestAction | ActionData | RapidApiAction | undefined;
  data: RestAction | ActionData | RapidApiAction | undefined;
}
interface ReduxActionProps {
  submitForm: (name: string) => void;
  createAction: (values: RestAction) => void;
  runAction: (id: string, paginationField?: PaginationField) => void;
  deleteAction: (id: string, name: string) => void;
  updateAction: (data: RestAction) => void;
}

function getPageName(pages: any, pageId: string) {
  const page = pages.find((page: any) => page.pageId === pageId);
  return page ? page.pageName : "";
}

type Props = ReduxActionProps &
  ReduxStateProps &
  RouteComponentProps<{ apiId: string; applicationId: string; pageId: string }>;

class ApiEditor extends React.Component<Props> {
  handleSubmit = (values: RestAction) => {
    const { formData } = this.props;
    this.props.updateAction(formData);
  };

  handleSaveClick = () => {
    const pageName = getPageName(this.props.pages, this.props.formData.pageId);
    AnalyticsUtil.logEvent("SAVE_API_CLICK", {
      apiName: this.props.formData.name,
      apiID: this.props.match.params.apiId,
      pageName: pageName,
    });
    this.props.submitForm(API_EDITOR_FORM_NAME);
  };
  handleDeleteClick = () => {
    const pageName = getPageName(this.props.pages, this.props.formData.pageId);
    AnalyticsUtil.logEvent("DELETE_API_CLICK", {
      apiName: this.props.formData.name,
      apiID: this.props.match.params.apiId,
      pageName: pageName,
    });
    this.props.deleteAction(
      this.props.match.params.apiId,
      this.props.formData.name,
    );
  };
  handleRunClick = (paginationField?: PaginationField) => {
    const pageName = getPageName(this.props.pages, this.props.formData.pageId);
    AnalyticsUtil.logEvent("RUN_API_CLICK", {
      apiName: this.props.formData.name,
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

  getAction = (apiId: string, actions: ActionDataState) => {
    const action = _.find(actions, a => a.config.id === apiId);
    if (action) {
      return action.config;
    } else {
      return undefined;
    }
  };

  render() {
    const {
      apiPane,
      match: {
        params: { apiId },
      },
      plugins,
      pluginId,
      data,
    } = this.props;

    let formUiComponent: string | undefined;
    if (apiId) {
      if (pluginId) {
        formUiComponent = this.getPluginUiComponentOfId(pluginId, plugins);
      } else {
        formUiComponent = this.getPluginUiComponentOfName(plugins);
      }
    }

    const { isSaving, isRunning, isDeleting, drafts } = apiPane;
    const paginationType = _.get(data, "actionConfiguration.paginationType");
    const apiHomeScreen = (
      <ApiHomeScreen
        applicationId={this.props.match.params.applicationId}
        pageId={this.props.match.params.pageId}
        history={this.props.history}
        location={this.props.location}
      />
    );
    const defaultHomeScreen = (
      <EmptyStateContainer>
        {"Create / Select an API from the list"}
      </EmptyStateContainer>
    );
    const v2Flag = checkForFlag(API_PANE_V2);
    const homeScreen = v2Flag ? apiHomeScreen : defaultHomeScreen;
    return (
      <React.Fragment>
        {apiId ? (
          <>
            {formUiComponent === "ApiEditorForm" && (
              <ApiEditorForm
                pluginId={pluginId}
                allowSave={apiId in drafts}
                paginationType={paginationType}
                isSaving={isSaving[apiId]}
                isRunning={isRunning[apiId]}
                isDeleting={isDeleting[apiId]}
                onSubmit={this.handleSubmit}
                onSaveClick={this.handleSaveClick}
                onDeleteClick={this.handleDeleteClick}
                onRunClick={this.handleRunClick}
                appName={
                  this.props.currentApplication
                    ? this.props.currentApplication.name
                    : ""
                }
              />
            )}

            {formUiComponent === "RapidApiEditorForm" && (
              <RapidApiEditorForm
                allowSave={apiId in drafts}
                paginationType={paginationType}
                isSaving={isSaving[apiId]}
                isRunning={isRunning[apiId]}
                isDeleting={isDeleting[apiId]}
                onSubmit={this.handleSubmit}
                onSaveClick={this.handleSaveClick}
                onDeleteClick={this.handleDeleteClick}
                onRunClick={this.handleRunClick}
                appName={
                  this.props.currentApplication
                    ? this.props.currentApplication.name
                    : ""
                }
              />
            )}
          </>
        ) : (
          homeScreen
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const formData = getFormValues(API_EDITOR_FORM_NAME)(state) as RestAction;
  const apiAction = getActionById(state, props);

  const { drafts } = state.ui.apiPane;
  let data: RestAction | ActionData | RapidApiAction | undefined;
  if (props.match.params.id in drafts) {
    data = drafts[props.match.params.id];
  } else {
    data = apiAction;
  }

  return {
    actions: state.entities.actions,
    apiPane: state.ui.apiPane,
    currentApplication: getCurrentApplication(state),
    currentPageName: getCurrentPageName(state),
    pages: state.entities.pageList.pages,
    formData,
    data,
    plugins: state.entities.plugins.list,
    pluginId: _.get(data, "pluginId"),
    apiAction,
  };
};

const mapDispatchToProps = (dispatch: any): ReduxActionProps => ({
  submitForm: (name: string) => dispatch(submit(name)),
  createAction: (action: RestAction) => dispatch(createActionRequest(action)),
  runAction: (id: string, paginationField?: PaginationField) =>
    dispatch(runApiAction(id, paginationField)),
  deleteAction: (id: string, name: string) =>
    dispatch(deleteAction({ id, name })),
  updateAction: (data: RestAction) => dispatch(updateAction({ data })),
});

export default connect(mapStateToProps, mapDispatchToProps)(ApiEditor);
