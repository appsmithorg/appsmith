import React from "react";
import { connect } from "react-redux";
import { submit } from "redux-form";
import ApiEditorForm from "./Form";
import RapidApiEditorForm from "./RapidApiEditorForm";
import { deleteAction, runAction } from "actions/pluginActionActions";
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
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  getActionById,
  getCurrentApplicationId,
  getCurrentPageName,
  getIsEditorInitialized,
} from "selectors/editorSelectors";
import { Plugin } from "api/PluginApi";
import { Action, PaginationType, RapidApiAction } from "entities/Action";
import { getApiName } from "selectors/formSelectors";
import Spinner from "components/editorComponents/Spinner";
import styled, { CSSProperties } from "styled-components";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { changeApi } from "actions/apiPaneActions";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as Sentry from "@sentry/react";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import { CurrentApplicationData } from "constants/ReduxActionConstants";
import {
  getPageList,
  getPlugins,
  getPluginSettingConfigs,
} from "selectors/entitiesSelector";
import { SAAS_EDITOR_API_ID_URL } from "../SaaSEditor/constants";
import history from "utils/history";

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

interface ReduxStateProps {
  actions: ActionDataState;
  isRunning: boolean;
  isDeleting: boolean;
  isCreating: boolean;
  apiName: string;
  currentApplication?: CurrentApplicationData;
  currentPageName: string | undefined;
  pages: any;
  plugins: Plugin[];
  pluginId: any;
  settingsConfig: any;
  apiAction: Action | ActionData | RapidApiAction | undefined;
  paginationType: PaginationType;
  isEditorInitialized: boolean;
  applicationId: string;
}
interface ReduxActionProps {
  submitForm: (name: string) => void;
  runAction: (id: string, paginationField?: PaginationField) => void;
  deleteAction: (id: string, name: string) => void;
  changeAPIPage: (apiId: string, isSaas: boolean) => void;
}

function getPageName(pages: any, pageId: string) {
  const page = pages.find((page: any) => page.pageId === pageId);
  return page ? page.pageName : "";
}

function getPackageNameFromPluginId(pluginId: string, plugins: Plugin[]) {
  const plugin = plugins.find((plugin: Plugin) => plugin.id === pluginId);
  return plugin?.packageName;
}

type Props = ReduxActionProps &
  ReduxStateProps &
  RouteComponentProps<{ apiId: string; pageId: string }>;

class ApiEditor extends React.Component<Props> {
  componentDidMount() {
    PerformanceTracker.stopTracking(PerformanceTransactionName.OPEN_ACTION, {
      actionType: "API",
    });
    const type = this.getFormName();
    this.props.changeAPIPage(this.props.match.params.apiId, type === "SAAS");
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

  getFormName = () => {
    const plugins = this.props.plugins;
    const pluginId = this.props.pluginId;
    const plugin =
      plugins &&
      plugins.find((plug) => {
        if (plug.id === pluginId) return plug;
      });
    return plugin && plugin.type;
  };

  componentDidUpdate(prevProps: Props) {
    if (prevProps.isRunning && !this.props.isRunning) {
      PerformanceTracker.stopTracking(PerformanceTransactionName.RUN_API_CLICK);
    }
    if (prevProps.match.params.apiId !== this.props.match.params.apiId) {
      const type = this.getFormName();
      this.props.changeAPIPage(this.props.match.params.apiId, type === "SAAS");
    }
  }

  handleRunClick = (paginationField?: PaginationField) => {
    const pageName = getPageName(
      this.props.pages,
      this.props.match.params.pageId,
    );
    PerformanceTracker.startTracking(PerformanceTransactionName.RUN_API_CLICK, {
      apiId: this.props.match.params.apiId,
    });
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
    const plugin = plugins.find((plugin) => plugin.id === id);
    if (!plugin) return undefined;
    return plugin.uiComponent;
  };

  getPluginUiComponentOfName = (plugins: Plugin[]): string | undefined => {
    const plugin = plugins.find(
      (plugin) => plugin.packageName === REST_PLUGIN_PACKAGE_NAME,
    );
    if (!plugin) return undefined;
    return plugin.uiComponent;
  };

  render() {
    const {
      isCreating,
      isDeleting,
      isEditorInitialized,
      isRunning,
      match: {
        params: { apiId },
      },
      paginationType,
      pluginId,
      plugins,
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

    let formUiComponent: string | undefined;
    if (apiId) {
      if (pluginId) {
        formUiComponent = this.getPluginUiComponentOfId(pluginId, plugins);
      } else {
        formUiComponent = this.getPluginUiComponentOfName(plugins);
      }
    }

    return (
      <div style={formStyles}>
        {formUiComponent === "ApiEditorForm" && (
          <ApiEditorForm
            apiName={this.props.apiName}
            appName={
              this.props.currentApplication
                ? this.props.currentApplication.name
                : ""
            }
            isDeleting={isDeleting}
            isRunning={isRunning}
            onDeleteClick={this.handleDeleteClick}
            onRunClick={this.handleRunClick}
            paginationType={paginationType}
            pluginId={pluginId}
            settingsConfig={this.props.settingsConfig}
          />
        )}
        {formUiComponent === "RapidApiEditorForm" && (
          <RapidApiEditorForm
            apiId={this.props.match.params.apiId}
            apiName={this.props.apiName}
            appName={
              this.props.currentApplication
                ? this.props.currentApplication.name
                : ""
            }
            isDeleting={isDeleting}
            isRunning={isRunning}
            location={this.props.location}
            onDeleteClick={this.handleDeleteClick}
            onRunClick={this.handleRunClick}
            paginationType={paginationType}
          />
        )}
        {formUiComponent === "SaaSEditorForm" &&
          history.push(
            SAAS_EDITOR_API_ID_URL(
              this.props.applicationId,
              this.props.match.params.pageId,
              getPackageNameFromPluginId(
                this.props.pluginId,
                this.props.plugins,
              ) ?? "",
              this.props.match.params.apiId,
            ),
          )}
      </div>
    );
  }
}

const formStyles: CSSProperties = {
  position: "relative",
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const apiAction = getActionById(state, props);
  const apiName = getApiName(state, props.match.params.apiId);
  const { isCreating, isDeleting, isRunning } = state.ui.apiPane;
  const pluginId = _.get(apiAction, "pluginId", "");
  const settingsConfig = getPluginSettingConfigs(state, pluginId);
  return {
    actions: state.entities.actions,
    currentApplication: getCurrentApplication(state),
    currentPageName: getCurrentPageName(state),
    pages: getPageList(state),
    apiName: apiName || "",
    plugins: getPlugins(state),
    pluginId,
    settingsConfig,
    paginationType: _.get(apiAction, "actionConfiguration.paginationType"),
    apiAction,
    isRunning: isRunning[props.match.params.apiId],
    isDeleting: isDeleting[props.match.params.apiId],
    isCreating: isCreating,
    isEditorInitialized: getIsEditorInitialized(state),
    applicationId: getCurrentApplicationId(state),
  };
};

const mapDispatchToProps = (dispatch: any): ReduxActionProps => ({
  submitForm: (name: string) => dispatch(submit(name)),
  runAction: (id: string, paginationField?: PaginationField) =>
    dispatch(runAction(id, paginationField)),
  deleteAction: (id: string, name: string) =>
    dispatch(deleteAction({ id, name })),
  changeAPIPage: (actionId: string, isSaas: boolean) =>
    dispatch(changeApi(actionId, isSaas)),
});

export default Sentry.withProfiler(
  connect(mapStateToProps, mapDispatchToProps)(ApiEditor),
);
