import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { initialize } from "redux-form";
import { getDBPlugins, getPluginImages } from "selectors/entitiesSelector";
import type { Plugin } from "api/PluginApi";
import { DATASOURCE_DB_FORM } from "@appsmith/constants/forms";
import {
  createDatasourceFromForm,
  createTempDatasourceFromForm,
} from "actions/datasourceActions";
import type { AppState } from "@appsmith/reducers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentApplication } from "@appsmith/selectors/applicationSelectors";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import { Colors } from "constants/Colors";
import { getQueryParams } from "utils/URLUtils";
import { getGenerateCRUDEnabledPluginMap } from "selectors/entitiesSelector";
import type { GenerateCRUDEnabledPluginMap } from "api/PluginApi";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

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
    color: ${Colors.BLACK};
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
  &:hover {
    background: ${Colors.GREY_1};
    cursor: pointer;
  }

  .dataSourceImageWrapper {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: ${Colors.GREY_2};
    display: flex;
    align-items: center;
    .dataSourceImage {
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

const DatasourceContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
  padding-left: 13.5px;
`;

interface DatasourceHomeScreenProps {
  pageId: string;
  location: {
    search: string;
  };
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
  showUnsupportedPluginDialog: (callback: any) => void;
}

interface ReduxDispatchProps {
  initializeForm: (data: Record<string, any>) => void;
  createDatasource: (data: any) => void;
  createTempDatasource: (data: any) => void;
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
    params?: any,
  ) => {
    const {
      currentApplication,
      generateCRUDSupportedPlugin,
      history,
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

  render() {
    const { currentApplication, pluginImages, plugins } = this.props;

    return (
      <DatasourceHomePage>
        <DatasourceCardsContainer data-testid="database-datasource-card-container">
          {plugins.map((plugin, idx) => {
            return (
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
                  <div className="dataSourceImageWrapper">
                    <img
                      alt="Datasource"
                      className="dataSourceImage"
                      data-testid="database-datasource-image"
                      src={getAssetUrl(pluginImages[plugin.id])}
                    />
                  </div>
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

const mapStateToProps = (state: AppState): ReduxStateProps => {
  const { datasources } = state.entities;
  return {
    pluginImages: getPluginImages(state),
    plugins: getDBPlugins(state),
    currentApplication: getCurrentApplication(state),
    isSaving: datasources.loading,
    generateCRUDSupportedPlugin: getGenerateCRUDEnabledPluginMap(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    initializeForm: (data: Record<string, any>) =>
      dispatch(initialize(DATASOURCE_DB_FORM, data)),
    createDatasource: (data: any) => dispatch(createDatasourceFromForm(data)),
    createTempDatasource: (data: any) =>
      dispatch(createTempDatasourceFromForm(data)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DatasourceHomeScreen);
