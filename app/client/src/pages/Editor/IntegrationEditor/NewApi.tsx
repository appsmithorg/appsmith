import React, { useCallback, useState, useEffect } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { createDatasourceFromForm } from "actions/datasourceActions";
import { AppState } from "@appsmith/reducers";
import { Colors } from "constants/Colors";
import CurlLogo from "assets/images/Curl-logo.svg";
import PlusLogo from "assets/images/Plus-logo.svg";
import { Plugin } from "api/PluginApi";
import { createNewApiAction } from "actions/apiPaneActions";
import AnalyticsUtil, { EventLocation } from "utils/AnalyticsUtil";
import { CURL } from "constants/AppsmithActionConstants/ActionConstants";
import { PluginType } from "entities/Action";
import { Spinner } from "@blueprintjs/core";
import { getQueryParams } from "utils/URLUtils";
import { GenerateCRUDEnabledPluginMap } from "api/PluginApi";
import { getGenerateCRUDEnabledPluginMap } from "selectors/entitiesSelector";
import { useSelector } from "react-redux";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { curlImportPageURL } from "RouteBuilder";
import { GRAPHQL_PLUGIN_PACKAGE_NAME } from "constants/ApiEditorConstants/GraphQLEditorConstants";
import { REST_PLUGIN_PACKAGE_NAME } from "constants/ApiEditorConstants/ApiEditorConstants";

const StyledContainer = styled.div`
  flex: 1;
  margin-top: 8px;
  .textBtn {
    font-size: 16px;
    line-height: 24px;
    margin: 0;
    justify-content: center;
    text-align: center;
    letter-spacing: -0.24px;
    color: ${Colors.BLACK};
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

const ApiCardsContainer = styled.div`
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

const ApiCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  &:hover {
    background-color: ${Colors.GREY_1};
    cursor: pointer;
  }

  .content-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: ${Colors.GREY_2};
    display: flex;
    align-items: center;

    .content-icon {
      height: 28px;
      width: auto;
      margin: 0 auto;
      max-width: 100%;
    }
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

const CardContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
  padding-left: 13.5px;
`;

type ApiHomeScreenProps = {
  createNewApiAction: (
    pageId: string,
    from: EventLocation,
    apiType?: string,
  ) => void;
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
};

type Props = ApiHomeScreenProps;

const API_ACTION = {
  IMPORT_CURL: "IMPORT_CURL",
  CREATE_NEW_API: "CREATE_NEW_API",
  CREATE_NEW_GRAPHQL_API: "CREATE_NEW_GRAPHQL_API",
  CREATE_DATASOURCE_FORM: "CREATE_DATASOURCE_FORM",
  AUTH_API: "AUTH_API",
};

function NewApiScreen(props: Props) {
  const { createNewApiAction, history, isCreating, pageId, plugins } = props;

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
      props.createDatasourceFromForm({
        pluginId: authApiPlugin.id,
      });
    }
  }, [authApiPlugin, props.createDatasourceFromForm]);

  const handleCreateNew = (source: string) => {
    AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
      source,
    });
    if (pageId) {
      createNewApiAction(
        pageId,
        "API_PANE",
        source === API_ACTION.CREATE_NEW_GRAPHQL_API
          ? GRAPHQL_PLUGIN_PACKAGE_NAME
          : REST_PLUGIN_PACKAGE_NAME,
      );
    }
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
        props.createDatasourceFromForm({ pluginId: params.pluginId });
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
  const API_PLUGINS = plugins.filter(
    (p) => p.packageName === GRAPHQL_PLUGIN_PACKAGE_NAME,
  );

  plugins.forEach((p) => {
    if (p.type === PluginType.SAAS || p.type === PluginType.REMOTE) {
      API_PLUGINS.push(p);
    }
  });

  return (
    <StyledContainer>
      <ApiCardsContainer data-testid="newapi-datasource-card-container">
        <ApiCard
          className="t--createBlankApiCard create-new-api"
          onClick={() => handleOnClick(API_ACTION.CREATE_NEW_API)}
        >
          <CardContentWrapper data-testid="newapi-datasource-content-wrapper">
            <div className="content-icon-wrapper">
              <img
                alt="New"
                className="curlImage t--plusImage content-icon"
                src={PlusLogo}
              />
            </div>
            <p className="textBtn">Create new API</p>
          </CardContentWrapper>
          {isCreating && <Spinner className="cta" size={25} />}
        </ApiCard>
        <ApiCard
          className="t--createBlankCurlCard"
          onClick={() => handleOnClick(API_ACTION.IMPORT_CURL)}
        >
          <CardContentWrapper>
            <div className="content-icon-wrapper">
              <img
                alt="CURL"
                className="curlImage t--curlImage content-icon"
                src={CurlLogo}
              />
            </div>
            <p className="textBtn">CURL import</p>
          </CardContentWrapper>
        </ApiCard>
        {authApiPlugin && (
          <ApiCard
            className="t--createAuthApiDatasource"
            onClick={() => handleOnClick(API_ACTION.AUTH_API)}
          >
            <CardContentWrapper>
              <div className="content-icon-wrapper">
                <img
                  alt="OAuth2"
                  className="authApiImage t--authApiImage content-icon"
                  src={authApiPlugin.iconLocation}
                />
              </div>
              <p className="textBtn">Authenticated API</p>
            </CardContentWrapper>
          </ApiCard>
        )}
        <ApiCard
          className="t--createBlankApiGraphqlCard"
          onClick={() => handleOnClick(API_ACTION.CREATE_NEW_GRAPHQL_API)}
        >
          <CardContentWrapper>
            <div className="content-icon-wrapper">
              <img
                alt="New"
                className="curlImage t--plusImage content-icon"
                src={PlusLogo}
              />
            </div>
            <p className="textBtn">Create new GraphQL API</p>
          </CardContentWrapper>
        </ApiCard>
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
              <div className="content-icon-wrapper">
                <img
                  alt={p.name}
                  className={
                    "content-icon saasImage t--saas-" + p.packageName + "-image"
                  }
                  src={p.iconLocation}
                />
              </div>
              <p className="t--plugin-name textBtn">{p.name}</p>
            </CardContentWrapper>
          </ApiCard>
        ))}
      </ApiCardsContainer>
    </StyledContainer>
  );
}

const mapStateToProps = (state: AppState) => ({
  plugins: state.entities.plugins.list,
});

const mapDispatchToProps = {
  createNewApiAction,
  createDatasourceFromForm,
};

export default connect(mapStateToProps, mapDispatchToProps)(NewApiScreen);
