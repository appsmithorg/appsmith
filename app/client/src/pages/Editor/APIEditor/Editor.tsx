import React from "react";
import { connect } from "react-redux";
import { submit } from "redux-form";
import RestApiEditorForm from "./RestAPIForm";
import type { AppState } from "ee/reducers";
import type { RouteComponentProps } from "react-router";
import type {
  ActionData,
  ActionDataState,
} from "ee/reducers/entityReducers/actionsReducer";
import _ from "lodash";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import {
  getCurrentApplicationId,
  getCurrentPageName,
} from "selectors/editorSelectors";
import type { Plugin } from "api/PluginApi";
import type { Action, PaginationType } from "entities/Action";
import { PluginPackageName } from "entities/Action";
import Spinner from "components/editorComponents/Spinner";
import type { CSSProperties } from "styled-components";
import styled from "styled-components";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import {
  changeApi,
  isActionDeleting,
  isActionRunning,
  isPluginActionCreating,
} from "PluginActionEditor/store";
import * as Sentry from "@sentry/react";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import type { ApplicationPayload } from "entities/Application";
import {
  getActionByBaseId,
  getPageList,
  getPlugins,
} from "ee/selectors/entitiesSelector";
import history from "utils/history";
import { saasEditorApiIdURL } from "ee/RouteBuilder";
import GraphQLEditorForm from "./GraphQL/GraphQLEditorForm";
import type { APIEditorRouteParams } from "constants/routes";
import { ApiEditorContext } from "./ApiEditorContext";

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

interface ReduxStateProps {
  actions: ActionDataState;
  isRunning: boolean;
  isDeleting: boolean;
  isCreating: boolean;
  apiId: string;
  apiName: string;
  currentApplication?: ApplicationPayload;
  currentPageName: string | undefined;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pages: any;
  plugins: Plugin[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pluginId: any;
  apiAction: Action | ActionData | undefined;
  paginationType: PaginationType;
  applicationId: string;
}

interface OwnProps {
  isEditorInitialized: boolean;
}

interface ReduxActionProps {
  submitForm: (name: string) => void;
  changeAPIPage: (apiId: string, isSaas: boolean) => void;
}

function getPackageNameFromPluginId(pluginId: string, plugins: Plugin[]) {
  const plugin = plugins.find((plugin: Plugin) => plugin.id === pluginId);

  return plugin?.packageName;
}

type Props = ReduxActionProps &
  ReduxStateProps &
  RouteComponentProps<APIEditorRouteParams> &
  OwnProps;

class ApiEditor extends React.Component<Props> {
  static contextType = ApiEditorContext;
  context!: React.ContextType<typeof ApiEditorContext>;

  componentDidMount() {
    const type = this.getFormName();

    if (this.props.apiId) {
      this.props.changeAPIPage(this.props.apiId, type === "SAAS");
    }
  }

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
    if (prevProps.apiId !== this.props.apiId) {
      const type = this.getFormName();

      this.props.changeAPIPage(this.props.apiId || "", type === "SAAS");
    }
  }

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
      (plugin) => plugin.packageName === PluginPackageName.REST_API,
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
        params: { baseApiId },
      },
      paginationType,
      pluginId,
      plugins,
    } = this.props;

    if (!pluginId && baseApiId) {
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

    if (baseApiId) {
      if (pluginId) {
        formUiComponent = this.getPluginUiComponentOfId(pluginId, plugins);
      } else {
        formUiComponent = this.getPluginUiComponentOfName(plugins);
      }
    }

    return (
      <div style={formStyles}>
        {formUiComponent === "ApiEditorForm" && (
          <RestApiEditorForm
            apiName={this.props.apiName}
            appName={
              this.props.currentApplication
                ? this.props.currentApplication.name
                : ""
            }
            isDeleting={isDeleting}
            isRunning={isRunning}
            onDeleteClick={this.context.handleDeleteClick}
            onRunClick={this.context.handleRunClick}
            paginationType={paginationType}
            pluginId={pluginId}
            settingsConfig={this.context.settingsConfig}
          />
        )}
        {formUiComponent === "GraphQLEditorForm" && (
          <GraphQLEditorForm
            apiName={this.props.apiName}
            appName={
              this.props.currentApplication
                ? this.props.currentApplication.name
                : ""
            }
            isDeleting={isDeleting}
            isRunning={isRunning}
            match={this.props.match}
            onDeleteClick={this.context.handleDeleteClick}
            onRunClick={this.context.handleRunClick}
            paginationType={paginationType}
            pluginId={pluginId}
            settingsConfig={this.context.settingsConfig}
          />
        )}
        {formUiComponent === "SaaSEditorForm" &&
          history.push(
            saasEditorApiIdURL({
              basePageId: this.props.match.params.basePageId,
              pluginPackageName:
                getPackageNameFromPluginId(
                  this.props.pluginId,
                  this.props.plugins,
                ) ?? "",
              baseApiId: this.props.match.params.baseApiId || "",
            }),
          )}
      </div>
    );
  }
}

const formStyles: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  flexGrow: "1",
  overflow: "auto",
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const apiAction = getActionByBaseId(state, props?.match?.params?.baseApiId);
  const apiName = apiAction?.name ?? "";
  const apiId = apiAction?.id ?? "";
  const isCreating = isPluginActionCreating(state);
  const isDeleting = isActionDeleting(apiId)(state);
  const isRunning = isActionRunning(apiId)(state);
  const pluginId = _.get(apiAction, "pluginId", "");

  return {
    actions: state.entities.actions,
    currentApplication: getCurrentApplication(state),
    currentPageName: getCurrentPageName(state),
    pages: getPageList(state),
    apiId,
    apiName,
    plugins: getPlugins(state),
    pluginId,
    paginationType: _.get(apiAction, "actionConfiguration.paginationType"),
    apiAction,
    isRunning,
    isDeleting,
    isCreating,
    applicationId: getCurrentApplicationId(state),
  };
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any): ReduxActionProps => ({
  submitForm: (name: string) => dispatch(submit(name)),
  changeAPIPage: (actionId: string, isSaas: boolean) =>
    dispatch(changeApi(actionId, isSaas)),
});

export default Sentry.withProfiler(
  connect(mapStateToProps, mapDispatchToProps)(ApiEditor),
);
