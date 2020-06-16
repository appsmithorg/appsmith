import React from "react";
import { connect } from "react-redux";
import { getFormValues, submit } from "redux-form";
import ApiEditorForm from "./Form";
import RapidApiEditorForm from "./RapidApiEditorForm";
import ApiHomeScreen from "./ApiHomeScreen";
import {
  runApiAction,
  deleteAction,
  updateAction,
} from "actions/actionActions";
import { PaginationField } from "api/ActionAPI";
import { AppState } from "reducers";
import { RouteComponentProps } from "react-router";
import { API_EDITOR_FORM_NAME } from "constants/forms";
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

interface ReduxStateProps {
  actions: ActionDataState;
  isRunning: Record<string, boolean>;
  isDeleting: Record<string, boolean>;
  allowSave: boolean;
  apiName: string;
  currentApplication: UserApplication;
  currentPageName: string | undefined;
  pages: any;
  plugins: Plugin[];
  pluginId: any;
  apiAction: RestAction | ActionData | RapidApiAction | undefined;
  paginationType: PaginationType;
  datasourceFieldText: string;
}
interface ReduxActionProps {
  submitForm: (name: string) => void;
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
    this.props.updateAction(values);
  };

  handleSaveClick = () => {
    const pageName = getPageName(
      this.props.pages,
      this.props.match.params.pageId,
    );
    AnalyticsUtil.logEvent("SAVE_API_CLICK", {
      apiName: this.props.apiName,
      apiID: this.props.match.params.apiId,
      pageName: pageName,
    });
    this.props.submitForm(API_EDITOR_FORM_NAME);
  };

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

  getAction = (apiId: string, actions: ActionDataState) => {
    const action = _.find(actions, a => a.config.id === apiId);
    if (action) {
      return action.config;
    } else {
      return undefined;
    }
  };

  onChangeHandler = _.debounce((changedValue: any) => {
    if (this.props.allowSave) {
      this.handleSubmit({
        ...changedValue,
        cacheResponse: undefined,
      });
    }
  }, 500);

  render() {
    const {
      match: {
        params: { apiId },
      },
      plugins,
      pluginId,
      isRunning,
      isDeleting,
      paginationType,
    } = this.props;

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
                onSubmit={this.handleSubmit}
                onDeleteClick={this.handleDeleteClick}
                onRunClick={this.handleRunClick}
                datasourceFieldText={this.props.datasourceFieldText}
                appName={
                  this.props.currentApplication
                    ? this.props.currentApplication.name
                    : ""
                }
                onChange={this.onChangeHandler}
                location={this.props.location}
              />
            )}

            {formUiComponent === "RapidApiEditorForm" && (
              <RapidApiEditorForm
                paginationType={paginationType}
                isRunning={isRunning[apiId]}
                isDeleting={isDeleting[apiId]}
                onSubmit={this.handleSubmit}
                onDeleteClick={this.handleDeleteClick}
                onRunClick={this.handleRunClick}
                appName={
                  this.props.currentApplication
                    ? this.props.currentApplication.name
                    : ""
                }
                onChange={this.onChangeHandler}
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
  const formData = getFormValues(API_EDITOR_FORM_NAME)(state) as RestAction;
  const apiAction = getActionById(state, props);

  const { drafts, isDeleting, isRunning } = state.ui.apiPane;
  let data: RestAction | ActionData | RapidApiAction | undefined;
  let allowSave;
  if (apiAction && apiAction.id in drafts) {
    data = drafts[apiAction.id];
    allowSave = true;
  } else {
    data = apiAction;
    allowSave = false;
  }
  const datasourceFieldText =
    state.ui.apiPane.datasourceFieldText[formData?.id ?? ""] || "";

  return {
    datasourceFieldText,
    actions: state.entities.actions,
    currentApplication: getCurrentApplication(state),
    currentPageName: getCurrentPageName(state),
    pages: state.entities.pageList.pages,
    apiName: formData?.name || "",
    plugins: state.entities.plugins.list,
    pluginId: _.get(data, "pluginId"),
    paginationType: _.get(data, "actionConfiguration.paginationType"),
    apiAction,
    isRunning,
    isDeleting,
    allowSave,
  };
};

const mapDispatchToProps = (dispatch: any): ReduxActionProps => ({
  submitForm: (name: string) => dispatch(submit(name)),
  runAction: (id: string, paginationField?: PaginationField) =>
    dispatch(runApiAction(id, paginationField)),
  deleteAction: (id: string, name: string) =>
    dispatch(deleteAction({ id, name })),
  updateAction: (data: RestAction) => dispatch(updateAction({ data })),
});

export default connect(mapStateToProps, mapDispatchToProps)(ApiEditor);
