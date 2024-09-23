import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { initialize } from "redux-form";
import {
  getDBPlugins,
  getPluginImages,
  getMostPopularPlugins,
} from "ee/selectors/entitiesSelector";
import type { Plugin } from "api/PluginApi";
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
import type { GenerateCRUDEnabledPluginMap } from "api/PluginApi";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ApiCard, API_ACTION, CardContentWrapper } from "./NewApi";
import { PluginPackageName, PluginType } from "entities/Action";
import { Spinner } from "@appsmith/ads";
import PlusLogo from "assets/images/Plus-logo.svg";
import {
  createMessage,
  CREATE_NEW_DATASOURCE_REST_API,
} from "ee/constants/messages";
import { createNewApiActionBasedOnEditorType } from "ee/actions/helpers";
import type { ActionParentEntityTypeInterface } from "ee/entities/Engine/actionHelpers";
import history from "utils/history";

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

const DatasourceHomePage = styled.div`
  .textBtn {
    justify-content: center;
    text-align: center;
    color: var(--ads-v2-color-fg);
    font-weight: 400;
    text-decoration: none !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 16px;
    line-height: 24px;
    letter-spacing: -0.24px;
    margin: 0;
  }
`;

const DatasourceCardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  text-align: center;
  min-width: 150px;
  border-radius: 4px;
  align-items: center;
`;

const DatasourceCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  border-radius: var(--ads-v2-border-radius);
  &:hover {
    background: var(--ads-v2-color-bg-subtle);
    cursor: pointer;
  }

  .dataSourceImage {
    height: 34px;
    width: auto;
    margin: 0 auto;
    max-width: 100%;
  }

  .cta {
    display: none;
    margin-right: 32px;
  }

  &:hover {
    .cta {
      display: flex;
    }
  }
`;

const DatasourceContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
  padding-left: 13.5px;
`;

interface DatasourceHomeScreenProps {
  editorType: string;
  editorId: string;
  parentEntityId: string;
  parentEntityType: ActionParentEntityTypeInterface;
  location: {
    search: string;
  };
  showMostPopularPlugins?: boolean;
  isCreating?: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showUnsupportedPluginDialog: (callback: any) => void;
  isAirgappedInstance?: boolean;
}

interface ReduxDispatchProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initializeForm: (data: Record<string, any>) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createDatasource: (data: any) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createTempDatasource: (data: any) => void;
  createNewApiActionBasedOnEditorType: (
    editorType: string,
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

type Props = ReduxStateProps & DatasourceHomeScreenProps & ReduxDispatchProps;

class DatasourceHomeScreen extends React.Component<Props> {
  goToCreateDatasource = (
    pluginId: string,
    pluginName: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params?: any,
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
    });
  };

  handleOnClick = () => {
    const { editorId, editorType, parentEntityId, parentEntityType } =
      this.props;

    AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
      source: API_ACTION.CREATE_NEW_API,
    });
    this.props.createNewApiActionBasedOnEditorType(
      editorType,
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
      <DatasourceHomePage>
        <DatasourceCardsContainer data-testid="database-datasource-card-container">
          {plugins.map((plugin, idx) => {
            return plugin.type === PluginType.API ? (
              !!showMostPopularPlugins ? (
                <ApiCard
                  className="t--createBlankApiCard create-new-api"
                  key={`${plugin.id}_${idx}`}
                  onClick={() => this.handleOnClick()}
                >
                  <CardContentWrapper data-testid="newapi-datasource-content-wrapper">
                    <img
                      alt="New"
                      className="curlImage t--plusImage content-icon"
                      src={PlusLogo}
                    />
                    <p className="textBtn">
                      {createMessage(CREATE_NEW_DATASOURCE_REST_API)}
                    </p>
                  </CardContentWrapper>
                  {/*@ts-expect-error Fix this the next time the file is edited*/}
                  {isCreating && <Spinner className="cta" size={25} />}
                </ApiCard>
              ) : null
            ) : (
              <DatasourceCard
                data-testid="database-datasource-card"
                key={`${plugin.id}_${idx}`}
                onClick={() => {
                  AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
                    appName: currentApplication?.name,
                    pluginName: plugin.name,
                    pluginPackageName: plugin.packageName,
                  });
                  this.goToCreateDatasource(plugin.id, plugin.name, {
                    packageName: plugin.packageName,
                  });
                }}
              >
                <DatasourceContentWrapper data-testid="database-datasource-content-wrapper">
                  <img
                    alt="Datasource"
                    className="dataSourceImage"
                    data-testid="database-datasource-image"
                    src={getAssetUrl(pluginImages[plugin.id])}
                  />
                  <p className="t--plugin-name textBtn">{plugin.name}</p>
                </DatasourceContentWrapper>
              </DatasourceCard>
            );
          })}
        </DatasourceCardsContainer>
      </DatasourceHomePage>
    );
  }
}

const mapStateToProps = (
  state: AppState,
  props: { showMostPopularPlugins?: boolean; isAirgappedInstance?: boolean },
) => {
  const { datasources } = state.entities;
  const mostPopularPlugins = getMostPopularPlugins(state);
  const filteredMostPopularPlugins: Plugin[] = !!props?.isAirgappedInstance
    ? mostPopularPlugins.filter(
        (plugin: Plugin) =>
          plugin?.packageName !== PluginPackageName.GOOGLE_SHEETS,
      )
    : mostPopularPlugins;

  return {
    pluginImages: getPluginImages(state),
    plugins: !!props?.showMostPopularPlugins
      ? filteredMostPopularPlugins
      : getDBPlugins(state),
    currentApplication: getCurrentApplication(state),
    isSaving: datasources.loading,
    generateCRUDSupportedPlugin: getGenerateCRUDEnabledPluginMap(state),
  };
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => {
  return {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initializeForm: (data: Record<string, any>) =>
      dispatch(initialize(DATASOURCE_DB_FORM, data)),
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createDatasource: (data: any) => dispatch(createDatasourceFromForm(data)),
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createTempDatasource: (data: any) =>
      dispatch(createTempDatasourceFromForm(data)),
    createNewApiActionBasedOnEditorType: (
      editorType: string,
      editorId: string,
      parentEntityId: string,
      parentEntityType: ActionParentEntityTypeInterface,
      apiType: string,
    ) =>
      dispatch(
        createNewApiActionBasedOnEditorType(
          editorType,
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
)(DatasourceHomeScreen);
