import React, { useEffect, useRef, type ReactNode } from "react";
import { connect } from "react-redux";
import { initialize } from "redux-form";
import {
  getDBPlugins,
  getPluginImages,
  getMostPopularPlugins,
} from "ee/selectors/entitiesSelector";
import { DATASOURCE_DB_FORM } from "ee/constants/forms";
import {
  createDatasourceFromForm,
  createTempDatasourceFromForm,
} from "actions/datasourceActions";
import type { AppState } from "ee/reducers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import type { ApplicationPayload } from "entities/Application";
import { getQueryParams } from "utils/URLUtils";
import { getGenerateCRUDEnabledPluginMap } from "ee/selectors/entitiesSelector";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { getAssetUrl, isAirgapped } from "ee/utils/airgapHelpers";
import { API_ACTION } from "./APIOrSaasPlugins";
import { Spinner } from "@appsmith/ads";
import {
  createMessage,
  CREATE_NEW_DATASOURCE_REST_API,
  CREATE_NEW_DATASOURCE_MOST_POPULAR_HEADER,
  CREATE_NEW_DATASOURCE_DATABASE_HEADER,
} from "ee/constants/messages";
import { createNewApiActionBasedOnIdeType } from "ee/actions/helpers";
import type { ActionParentEntityTypeInterface } from "ee/entities/Engine/actionHelpers";
import history from "utils/history";
import {
  DatasourceContainer,
  DatasourceSection,
  DatasourceSectionHeading,
  StyledDivider,
} from "./IntegrationStyledComponents";
import DatasourceItem from "./DatasourceItem";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { useParentEntityInfo } from "ee/IDE/hooks/useParentEntityInfo";
import scrollIntoView from "scroll-into-view-if-needed";
import { pluginSearchSelector } from "./CreateNewDatasourceHeader";
import type { CreateDatasourceConfig } from "api/DatasourcesApi";
import type { Datasource } from "entities/Datasource";
import type { AnyAction, Dispatch } from "redux";
import {
  type GenerateCRUDEnabledPluginMap,
  type Plugin,
  PluginPackageName,
  PluginType,
} from "entities/Plugin";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";
import type { IDEType } from "ee/entities/IDE/constants";

// This function remove the given key from queryParams and return string
const removeQueryParams = (paramKeysToRemove: Array<string>) => {
  const queryParams = getQueryParams();
  let queryString = "";
  const queryParamKeys = Object.keys(queryParams);

  if (queryParamKeys && queryParamKeys.length) {
    queryParamKeys.map((key) => {
      if (!paramKeysToRemove.includes(key)) {
        queryString +=
          encodeURIComponent(key) + "=" + encodeURIComponent(queryParams[key]);
      }
    });

    return "?" + queryString;
  }

  return "";
};

interface DBOrMostPopularPluginsProps {
  ideType: IDEType;
  editorId: string;
  parentEntityId: string;
  parentEntityType: ActionParentEntityTypeInterface;
  location: {
    search: string;
  };
  showMostPopularPlugins?: boolean;
  isCreating?: boolean;
  showUnsupportedPluginDialog: (callback: () => void) => void;
  children?: ReactNode;
}

interface ReduxDispatchProps {
  initializeForm: (data: Record<string, unknown>) => void;
  createDatasource: (data: CreateDatasourceConfig & Datasource) => void;
  createTempDatasource: typeof createTempDatasourceFromForm;
  createNewApiActionBasedOnIdeType: (
    ideType: IDEType,
    editorId: string,
    parentEntityId: string,
    parentEntityType: ActionParentEntityTypeInterface,
    apiType: string,
  ) => void;
}

interface ReduxStateProps {
  plugins: Plugin[];
  currentApplication?: ApplicationPayload;
  pluginImages: Record<string, string>;
  isSaving: boolean;
  generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap;
}

interface CreateDBOrMostPopularPluginsProps {
  location: {
    search: string;
  };
  showMostPopularPlugins?: boolean;
  isCreating?: boolean;
  showUnsupportedPluginDialog: (callback: () => void) => void;
  children?: ReactNode;
  isOnboardingScreen?: boolean;
  active?: boolean;
  pageId: string;
  addDivider?: boolean;
}

type CreateDBOrMostPopularPluginsType = ReduxStateProps &
  CreateDBOrMostPopularPluginsProps &
  ReduxDispatchProps;

type Props = DBOrMostPopularPluginsProps & CreateDBOrMostPopularPluginsType;

class DBOrMostPopularPlugins extends React.Component<Props> {
  goToCreateDatasource = (
    pluginId: string,
    pluginName: string,
    params?: {
      skipValidPluginCheck?: boolean;
      packageName?: string;
      type?: PluginType;
    },
  ) => {
    const {
      currentApplication,
      generateCRUDSupportedPlugin,
      showUnsupportedPluginDialog,
    } = this.props;

    const isGeneratePageInitiator = getIsGeneratePageInitiator();

    /* When isGeneratePageMode is generate page (i.e., Navigating from generate-page) before creating datasource check is it supported datasource for generate template from db?
        If YES => continue creating datasource
        If NO =>
          Show user a UnsupportedPluginDialog to choose
            1. "create unsupported datasource"
            2. "continue" generate page flow by selecting other supported datasource
        goToCreateDatasource function is passed as a callback with params.skipValidPluginCheck = true.
        Whenever user click on "continue" in UnsupportedPluginDialog, this callback function is invoked.
    */
    if (isGeneratePageInitiator && !params?.skipValidPluginCheck) {
      AnalyticsUtil.logEvent("GEN_CRUD_PAGE_DATA_SOURCE_CLICK", {
        appName: currentApplication?.name,
        plugin: pluginName,
        packageName: params?.packageName,
      });

      if (!generateCRUDSupportedPlugin[pluginId]) {
        // show modal informing user that this will break the generate flow.
        showUnsupportedPluginDialog(() => {
          const URL =
            window.location.pathname +
            removeQueryParams(["isGeneratePageMode"]);

          history.replace(URL);
          this.goToCreateDatasource(pluginId, pluginName, {
            skipValidPluginCheck: true,
          });
        });

        return;
      }
    }

    this.props.createTempDatasource({
      pluginId,
      type: params!.type!,
    });
  };

  handleOnClick = () => {
    const { editorId, ideType, parentEntityId, parentEntityType } = this.props;

    AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
      source: API_ACTION.CREATE_NEW_API,
    });
    this.props.createNewApiActionBasedOnIdeType(
      ideType,
      editorId,
      parentEntityId,
      parentEntityType,
      PluginPackageName.REST_API,
    );
  };

  render() {
    const {
      currentApplication,
      isCreating,
      pluginImages,
      plugins,
      showMostPopularPlugins,
    } = this.props;

    return (
      <DatasourceContainer data-testid="database-datasource-card-container">
        {plugins.map((plugin, idx) => {
          return plugin.type === PluginType.API ? (
            !!showMostPopularPlugins ? (
              <DatasourceItem
                className="t--createBlankApiCard create-new-api"
                dataCardWrapperTestId="newapi-datasource-content-wrapper"
                handleOnClick={this.handleOnClick}
                icon={getAssetUrl(`${ASSETS_CDN_URL}/plus.png`)}
                key={`${plugin.id}_${idx}`}
                name={createMessage(CREATE_NEW_DATASOURCE_REST_API)}
              />
            ) : null
          ) : (
            <DatasourceItem
              dataCardImageTestId="database-datasource-image"
              dataCardTestId="database-datasource-card"
              dataCardWrapperTestId="database-datasource-content-wrapper"
              handleOnClick={() => {
                AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
                  appName: currentApplication?.name,
                  pluginName: plugin.name,
                  pluginPackageName: plugin.packageName,
                });
                this.goToCreateDatasource(plugin.id, plugin.name, {
                  packageName: plugin.packageName,
                  type: plugin.type,
                });
              }}
              icon={getAssetUrl(pluginImages[plugin.id])}
              key={`${plugin.id}_${idx}`}
              name={plugin.name}
              rightSibling={
                isCreating && <Spinner className="cta" size={"sm"} />
              }
            />
          );
        })}
      </DatasourceContainer>
    );
  }
}

function CreateDBOrMostPopularPlugins(props: CreateDBOrMostPopularPluginsType) {
  const ideType = getIDETypeByUrl(location.pathname);
  const { editorId, parentEntityId, parentEntityType } =
    useParentEntityInfo(ideType);
  const newDatasourceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (props.active && newDatasourceRef.current) {
      scrollIntoView(newDatasourceRef.current, {
        behavior: "smooth",
        scrollMode: "always",
        block: "start",
        boundary: document.getElementById("new-integrations-wrapper"),
      });
    }
  }, [props.active]);

  if (props.plugins.length === 0) return null;

  return (
    <>
      {props.addDivider && <StyledDivider />}
      <DatasourceSection id="new-datasources" ref={newDatasourceRef}>
        <DatasourceSectionHeading kind="heading-m">
          {props.showMostPopularPlugins
            ? createMessage(CREATE_NEW_DATASOURCE_MOST_POPULAR_HEADER)
            : createMessage(CREATE_NEW_DATASOURCE_DATABASE_HEADER)}
        </DatasourceSectionHeading>
        <DBOrMostPopularPlugins
          {...props}
          editorId={editorId}
          ideType={ideType}
          isCreating={props.isCreating}
          location={location}
          parentEntityId={
            parentEntityId || (props.isOnboardingScreen && props.pageId) || ""
          }
          parentEntityType={parentEntityType}
        />
      </DatasourceSection>
    </>
  );
}

const mapStateToProps = (
  state: AppState,
  props: {
    active?: boolean;
    pageId: string;
    showMostPopularPlugins?: boolean;
    isOnboardingScreen?: boolean;
    isCreating?: boolean;
  },
) => {
  const { datasources } = state.entities;
  const mostPopularPlugins = getMostPopularPlugins(state);
  const isAirgappedInstance = isAirgapped();
  const searchedPlugin = (
    pluginSearchSelector(state, "search") || ""
  ).toLocaleLowerCase();
  const filteredMostPopularPlugins: Plugin[] = !!isAirgappedInstance
    ? mostPopularPlugins.filter(
        (plugin: Plugin) =>
          plugin?.packageName !== PluginPackageName.GOOGLE_SHEETS,
      )
    : mostPopularPlugins;

  let plugins = !!props?.showMostPopularPlugins
    ? filteredMostPopularPlugins
    : getDBPlugins(state);

  plugins = plugins.filter((plugin) =>
    plugin.name.toLocaleLowerCase().includes(searchedPlugin),
  );

  return {
    pluginImages: getPluginImages(state),
    plugins,
    currentApplication: getCurrentApplication(state),
    isSaving: datasources.loading,
    generateCRUDSupportedPlugin: getGenerateCRUDEnabledPluginMap(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => {
  return {
    initializeForm: (data: Record<string, unknown>) =>
      dispatch(initialize(DATASOURCE_DB_FORM, data)),
    createDatasource: (data: CreateDatasourceConfig & Datasource) =>
      dispatch(createDatasourceFromForm(data)),
    createTempDatasource: (data: { pluginId: string; type: PluginType }) =>
      dispatch(createTempDatasourceFromForm(data)),
    createNewApiActionBasedOnIdeType: (
      ideType: IDEType,
      editorId: string,
      parentEntityId: string,
      parentEntityType: ActionParentEntityTypeInterface,
      apiType: string,
    ) =>
      dispatch(
        createNewApiActionBasedOnIdeType(
          ideType,
          editorId,
          parentEntityId,
          parentEntityType,
          apiType,
        ),
      ),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CreateDBOrMostPopularPlugins);
