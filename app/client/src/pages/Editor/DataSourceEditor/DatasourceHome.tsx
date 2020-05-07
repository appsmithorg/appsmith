import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { initialize } from "redux-form";
import { Card, Spinner } from "@blueprintjs/core";
import {
  getDatasourceNames,
  getDatasourcePlugins,
} from "selectors/entitiesSelector";
import { getNextEntityName } from "utils/AppsmithUtils";
import { Plugin } from "api/PluginApi";
import { DATASOURCE_DB_FORM } from "constants/forms";
import ImageAlt from "assets/images/placeholder-image.svg";
import Postgres from "assets/images/Postgress.png";
import MongoDB from "assets/images/MongoDB.png";
import RestTemplateImage from "assets/images/RestAPI.png";
import { REST_PLUGIN_PACKAGE_NAME } from "constants/ApiEditorConstants";
import {
  PLUGIN_PACKAGE_POSTGRES,
  PLUGIN_PACKAGE_MONGO,
} from "constants/QueryEditorConstants";
import {
  selectPlugin,
  createDatasourceFromForm,
} from "actions/datasourceActions";
import { AppState } from "reducers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { UserApplication } from "constants/userConstants";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";

const DatasourceHomePage = styled.div`
  font-size: 20px;
  padding: 20px;
  margin-left: 10px;
  max-height: 95vh;
  overflow: auto;
  padding-bottom: 50px;
  .textBtn {
    font-size: 14px;
    justify-content: center;
    text-align: center;
    letter-spacing: -0.17px;
    color: #2e3d49;
    font-weight: 500;
    text-decoration: none !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const StyledContainer = styled.div`
  flex: 1;
  padding-top: 12px;
  padding-bottom: 12px;

  .sectionHeadings {
    font-weight: 500;
    font-size: 16px;
  }
`;

const CardsWrapper = styled.div`
  flex: 1;
  display: -webkit-box;
  flex-wrap: wrap;
  -webkit-box-pack: start !important;
  justify-content: center;
  text-align: center;
  min-width: 140px;
  border-radius: 4px;
`;

const DatasourceCardsContainer = styled.div`
  flex: 1;
  display: inline-flex;
  flex-wrap: wrap;
  margin-left: -10px;
  justify-content: flex-start;
  text-align: center;
  min-width: 150px;
  border-radius: 4px;

  .eachDatasourceCard {
    margin: 10px;
    width: 140px;
    height: 110px;
    padding-bottom: 0px;
    cursor: pointer;
  }
  .dataSourceImage {
    height: 52px;
    width: auto;
    margin-top: -5px;
    max-width: 100%;
    margin-bottom: 2px;
  }
`;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

interface DatasourceHomeScreenProps {
  isSaving: boolean;
  pageId: string;
  applicationId: string;
  location: {
    search: string;
  };
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
  selectPlugin: (pluginType: string) => void;
}

interface ReduxDispatchProps {
  initializeForm: (data: Record<string, any>) => void;
  createDatasource: (data: any) => void;
}

interface ReduxStateProps {
  plugins: Plugin[];
  datasourceNames: string[];
  currentApplication: UserApplication;
}

type Props = ReduxStateProps & DatasourceHomeScreenProps & ReduxDispatchProps;

class DatasourceHomeScreen extends React.Component<Props> {
  goToCreateDatasource = (pluginId: string, packageName: string) => {
    const { datasourceNames, currentApplication } = this.props;
    let type = "";

    AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
      appName: currentApplication.name,
    });

    switch (packageName) {
      case PLUGIN_PACKAGE_POSTGRES:
        type = "POSTGRES";
        break;
      case PLUGIN_PACKAGE_MONGO:
        type = "MONGODB";
        break;
      case REST_PLUGIN_PACKAGE_NAME:
        type = "REST API";
        break;
      default:
        break;
    }

    const name = getNextEntityName(
      `Untitled Datasource ${type}`,
      datasourceNames,
    );

    this.props.selectPlugin(pluginId);
    this.props.createDatasource({
      name,
      pluginId,
    });
  };

  getImageSrc = (packageName: string) => {
    switch (packageName) {
      case PLUGIN_PACKAGE_POSTGRES:
        return Postgres;
      case PLUGIN_PACKAGE_MONGO:
        return MongoDB;
      case REST_PLUGIN_PACKAGE_NAME:
        return RestTemplateImage;
      default:
        return ImageAlt;
    }
  };

  render() {
    const { plugins, isSaving } = this.props;

    return (
      <DatasourceHomePage>
        <StyledContainer>
          <p className="sectionHeadings">Select Datasource Type</p>
        </StyledContainer>
        <CardsWrapper>
          {isSaving ? (
            <LoadingContainer>
              <Spinner size={30} />
            </LoadingContainer>
          ) : (
            <DatasourceCardsContainer>
              {plugins.map(plugin => {
                return (
                  <Card
                    interactive={false}
                    className="eachDatasourceCard"
                    key={plugin.id}
                    onClick={() =>
                      this.goToCreateDatasource(plugin.id, plugin.packageName)
                    }
                  >
                    <img
                      src={this.getImageSrc(plugin.packageName)}
                      className="dataSourceImage"
                      alt="Datasource"
                    ></img>
                    <p className="textBtn">{plugin.name}</p>
                  </Card>
                );
              })}
            </DatasourceCardsContainer>
          )}
        </CardsWrapper>
      </DatasourceHomePage>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => {
  return {
    plugins: getDatasourcePlugins(state),
    datasourceNames: getDatasourceNames(state),
    currentApplication: getCurrentApplication(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    selectPlugin: (pluginId: string) => dispatch(selectPlugin(pluginId)),
    initializeForm: (data: Record<string, any>) =>
      dispatch(initialize(DATASOURCE_DB_FORM, data)),
    createDatasource: (data: any) => dispatch(createDatasourceFromForm(data)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DatasourceHomeScreen);
