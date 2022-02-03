import React, { useCallback, useState, useEffect } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { getCurlImportPageURL } from "constants/routes";
import { createDatasourceFromForm } from "actions/datasourceActions";
import { AppState } from "reducers";
import { Colors } from "constants/Colors";
import CurlLogo from "assets/images/Curl-logo.svg";
import PlusLogo from "assets/images/Plus-logo.svg";
import { Plugin } from "api/PluginApi";
import { createNewApiAction } from "actions/apiPaneActions";
import AnalyticsUtil, { EventLocation } from "utils/AnalyticsUtil";
import { CURL } from "constants/AppsmithActionConstants/ActionConstants";
import { PluginType } from "entities/Action";
import { Spinner } from "@blueprintjs/core";
import { getQueryParams } from "utils/AppsmithUtils";
import { GenerateCRUDEnabledPluginMap } from "../../../api/PluginApi";
import { getGenerateCRUDEnabledPluginMap } from "../../../selectors/entitiesSelector";
import { useSelector } from "react-redux";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { getCurrentApplicationId } from "selectors/editorSelectors";

const StyledContainer = styled.div`
  flex: 1;
  margin-top: 8px;
  .textBtn {
    font-size: 16px;
    line-height: 24px;
    margin: 0;
    justify-content: center;
    text-align: center;
    letter-spacing: -0.17px;
    color: ${Colors.OXFORD_BLUE};
    font-weight: 500;
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
    background: ${Colors.Gallery};
    cursor: pointer;
  }

  .content-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 20px;
    padding: 6px 0;
    margin: 0 8px;
    background: #f0f0f0;
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
`;

type ApiHomeScreenProps = {
  createNewApiAction: (pageId: string, from: EventLocation) => void;
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
  CREATE_DATASOURCE_FORM: "CREATE_DATASOURCE_FORM",
  AUTH_API: "AUTH_API",
};

function NewApiScreen(props: Props) {
  const { createNewApiAction, history, isCreating, pageId, plugins } = props;

  const applicationId = useSelector(getCurrentApplicationId);

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

  const handleCreateNew = () => {
    AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
      source: "CREATE_NEW_API",
    });
    if (pageId) {
      createNewApiAction(pageId, "API_PANE");
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
        handleCreateNew();
        break;
      case API_ACTION.IMPORT_CURL: {
        AnalyticsUtil.logEvent("IMPORT_API_CLICK", {
          importSource: CURL,
        });
        AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
          source: CURL,
        });

        delete queryParams.isGeneratePageMode;
        const curlImportURL = getCurlImportPageURL(applicationId, pageId, {
          from: "datasources",
          ...queryParams,
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

  return (
    <StyledContainer>
      <ApiCardsContainer>
        <ApiCard
          className="t--createBlankApiCard create-new-api"
          onClick={() => handleOnClick(API_ACTION.CREATE_NEW_API)}
        >
          <CardContentWrapper>
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
        {plugins
          .filter(
            (p) => p.type === PluginType.SAAS || p.type === PluginType.REMOTE,
          )
          .map((p) => (
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
                      "content-icon saasImage t--saas-" +
                      p.packageName +
                      "-image"
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
