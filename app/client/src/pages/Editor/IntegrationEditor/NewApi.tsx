import React, { useCallback, useEffect, useState } from "react";
import { connect, useSelector } from "react-redux";
import styled from "styled-components";
import {
  createDatasourceFromForm,
  createTempDatasourceFromForm,
} from "actions/datasourceActions";
import type { AppState } from "@appsmith/reducers";
import CurlLogo from "assets/images/Curl-logo.svg";
import PlusLogo from "assets/images/Plus-logo.svg";
import type { GenerateCRUDEnabledPluginMap, Plugin } from "api/PluginApi";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { CURL } from "constants/AppsmithActionConstants/ActionConstants";
import { PluginPackageName, PluginType } from "entities/Action";
import { getQueryParams } from "utils/URLUtils";
import { getGenerateCRUDEnabledPluginMap } from "@appsmith/selectors/entitiesSelector";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { curlImportPageURL } from "@appsmith/RouteBuilder";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { Spinner } from "design-system";
import { useEditorType } from "@appsmith/hooks";
import { useParentEntityInfo } from "@appsmith/hooks/datasourceEditorHooks";
import { createNewApiActionBasedOnEditorType } from "@appsmith/actions/helpers";
import type { ActionParentEntityTypeInterface } from "@appsmith/entities/Engine/actionHelpers";

export const StyledContainer = styled.div`
  flex: 1;
  margin-top: 8px;
  .textBtn {
    font-size: 16px;
    line-height: 24px;
    margin: 0;
    justify-content: center;
    text-align: center;
    letter-spacing: -0.24px;
    color: var(--ads-v2-color-fg);
    font-weight: 400;
    text-decoration: none !important;
    flex-wrap: wrap;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media (min-width: 2500px) {
    .textBtn {
      font-size: 18px;
    }
  }
  @media (min-width: 2500px) {
    .eachCard {
      width: 240px;
      height: 200px;
    }
    .apiImage {
      margin-top: 25px;
      margin-bottom: 20px;
      height: 80px;
    }
    .curlImage {
      width: 100px;
    }
    .createIcon {
      height: 70px;
    }
  }
`;

export const ApiCardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  text-align: center;
  min-width: 150px;
  border-radius: 4px;
  align-items: center;

  .create-new-api {
    &:hover {
      cursor: pointer;
    }
  }
`;

export const ApiCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  border-radius: var(--ads-v2-border-radius);

  &:hover {
    background-color: var(--ads-v2-color-bg-subtle);
    cursor: pointer;
  }

  .content-icon {
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

export const CardContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
  padding-left: 13.5px;
`;

interface ApiHomeScreenProps {
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
  location: {
    search: string;
  };
  pageId: string;
  plugins: Plugin[];
  createDatasourceFromForm: (data: any) => void;
  isCreating: boolean;
  showUnsupportedPluginDialog: (callback: any) => void;
  createTempDatasourceFromForm: (data: any) => void;
  showSaasAPIs: boolean; // If this is true, only SaaS APIs will be shown
  createNewApiActionBasedOnEditorType: (
    editorType: string,
    editorId: string,
    parentEntityId: string,
    parentEntityType: ActionParentEntityTypeInterface,
    apiType: string,
  ) => void;
}

type Props = ApiHomeScreenProps;

export const API_ACTION = {
  IMPORT_CURL: "IMPORT_CURL",
  CREATE_NEW_API: "CREATE_NEW_API",
  CREATE_NEW_GRAPHQL_API: "CREATE_NEW_GRAPHQL_API",
  CREATE_DATASOURCE_FORM: "CREATE_DATASOURCE_FORM",
  AUTH_API: "AUTH_API",
};

function NewApiScreen(props: Props) {
  const { history, isCreating, pageId, plugins, showSaasAPIs } = props;
  const editorType = useEditorType(location.pathname);
  const { editorId, parentEntityId, parentEntityType } =
    useParentEntityInfo(editorType);
  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap = useSelector(
    getGenerateCRUDEnabledPluginMap,
  );
  const [authApiPlugin, setAuthAPiPlugin] = useState<Plugin | undefined>();

  useEffect(() => {
    const plugin = plugins.find((p) => p.name === "REST API");
    setAuthAPiPlugin(plugin);
  }, [plugins]);

  const handleCreateAuthApiDatasource = useCallback(() => {
    if (authApiPlugin) {
      AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_AUTH_API_CLICK", {
        pluginId: authApiPlugin.id,
      });
      AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
        pluginName: authApiPlugin.name,
        pluginPackageName: authApiPlugin.packageName,
      });
      props.createTempDatasourceFromForm({
        pluginId: authApiPlugin.id,
      });
    }
  }, [authApiPlugin, props.createTempDatasourceFromForm]);

  const handleCreateNew = (source: string) => {
    AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
      source,
    });
    props.createNewApiActionBasedOnEditorType(
      editorType,
      editorId,
      parentEntityId,
      parentEntityType,
      source === API_ACTION.CREATE_NEW_GRAPHQL_API
        ? PluginPackageName.GRAPHQL
        : PluginPackageName.REST_API,
    );
  };

  // On click of any API card, handleOnClick action should be called to check if user came from generate-page flow.
  // if yes then show UnsupportedDialog for the API which are not supported to generate CRUD page.
  const handleOnClick = (actionType: string, params?: any) => {
    const queryParams = getQueryParams();
    const isGeneratePageInitiator = getIsGeneratePageInitiator(
      queryParams.isGeneratePageMode,
    );
    if (
      isGeneratePageInitiator &&
      !params?.skipValidPluginCheck &&
      !generateCRUDSupportedPlugin[params?.pluginId]
    ) {
      // show modal informing user that this will break the generate flow.
      props?.showUnsupportedPluginDialog(() =>
        handleOnClick(actionType, { skipValidPluginCheck: true, ...params }),
      );
      return;
    }
    switch (actionType) {
      case API_ACTION.CREATE_NEW_API:
      case API_ACTION.CREATE_NEW_GRAPHQL_API:
        handleCreateNew(actionType);
        break;
      case API_ACTION.IMPORT_CURL: {
        AnalyticsUtil.logEvent("IMPORT_API_CLICK", {
          importSource: CURL,
        });
        AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
          source: CURL,
        });

        delete queryParams.isGeneratePageMode;
        const curlImportURL = curlImportPageURL({
          pageId,
          params: {
            from: "datasources",
            ...queryParams,
          },
        });

        history.push(curlImportURL);
        break;
      }
      case API_ACTION.CREATE_DATASOURCE_FORM: {
        props.createTempDatasourceFromForm({
          pluginId: params.pluginId,
          type: params.type,
        });
        break;
      }
      case API_ACTION.AUTH_API: {
        handleCreateAuthApiDatasource();
        break;
      }
      default:
    }
  };

  // Api plugins with Graphql
  const API_PLUGINS = plugins.filter((p) =>
    !showSaasAPIs
      ? p.packageName === PluginPackageName.GRAPHQL
      : p.type === PluginType.SAAS ||
        p.type === PluginType.REMOTE ||
        p.type === PluginType.AI,
  );

  return (
    <StyledContainer>
      <ApiCardsContainer data-testid="newapi-datasource-card-container">
        {!showSaasAPIs && (
          <>
            <ApiCard
              className="t--createBlankApiCard create-new-api"
              onClick={() => handleOnClick(API_ACTION.CREATE_NEW_API)}
            >
              <CardContentWrapper data-testid="newapi-datasource-content-wrapper">
                <img
                  alt="New"
                  className="curlImage t--plusImage content-icon"
                  src={PlusLogo}
                />
                <p className="textBtn">REST API</p>
              </CardContentWrapper>
              {isCreating && <Spinner className="cta" size={25} />}
            </ApiCard>
            <ApiCard
              className="t--createBlankApiGraphqlCard"
              onClick={() => handleOnClick(API_ACTION.CREATE_NEW_GRAPHQL_API)}
            >
              <CardContentWrapper>
                <img
                  alt="New"
                  className="curlImage t--plusImage content-icon"
                  src={PlusLogo}
                />
                <p className="textBtn">GraphQL API</p>
              </CardContentWrapper>
            </ApiCard>
            {authApiPlugin && (
              <ApiCard
                className="t--createAuthApiDatasource"
                onClick={() => handleOnClick(API_ACTION.AUTH_API)}
              >
                <CardContentWrapper>
                  <img
                    alt="OAuth2"
                    className="authApiImage t--authApiImage content-icon"
                    src={getAssetUrl(authApiPlugin.iconLocation)}
                  />
                  <p className="t--plugin-name textBtn">Authenticated API</p>
                </CardContentWrapper>
              </ApiCard>
            )}
          </>
        )}
        {API_PLUGINS.map((p) => (
          <ApiCard
            className={`t--createBlankApi-${p.packageName}`}
            key={p.id}
            onClick={() => {
              AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
                pluginName: p.name,
                pluginPackageName: p.packageName,
              });
              handleOnClick(API_ACTION.CREATE_DATASOURCE_FORM, {
                pluginId: p.id,
              });
            }}
          >
            <CardContentWrapper>
              <img
                alt={p.name}
                className={
                  "content-icon saasImage t--saas-" + p.packageName + "-image"
                }
                src={getAssetUrl(p.iconLocation)}
              />
              <p className="t--plugin-name textBtn">{p.name}</p>
            </CardContentWrapper>
          </ApiCard>
        ))}
        {!showSaasAPIs && (
          <ApiCard
            className="t--createBlankCurlCard"
            onClick={() => handleOnClick(API_ACTION.IMPORT_CURL)}
          >
            <CardContentWrapper>
              <img
                alt="CURL"
                className="curlImage t--curlImage content-icon"
                src={CurlLogo}
              />
              <p className="textBtn">CURL import</p>
            </CardContentWrapper>
          </ApiCard>
        )}
      </ApiCardsContainer>
    </StyledContainer>
  );
}

const mapStateToProps = (state: AppState) => ({
  plugins: state.entities.plugins.list,
});

const mapDispatchToProps = {
  createDatasourceFromForm,
  createTempDatasourceFromForm,
  createNewApiActionBasedOnEditorType,
};

export default connect(mapStateToProps, mapDispatchToProps)(NewApiScreen);
