import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { initialize } from "redux-form";
import { getDBPlugins, getPluginImages } from "selectors/entitiesSelector";
import { Plugin } from "api/PluginApi";
import { DATASOURCE_DB_FORM } from "constants/forms";
import { createDatasourceFromForm } from "actions/datasourceActions";
import { AppState } from "reducers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { ApplicationPayload } from "constants/ReduxActionConstants";
import { Colors } from "constants/Colors";

const DatasourceHomePage = styled.div`
  max-height: 95vh;
  .textBtn {
    justify-content: center;
    text-align: center;
    color: #2e3d49;
    font-weight: 500;
    text-decoration: none !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    font-weight: 500;
    font-size: 16px;
    line-height: 24px;
    letter-spacing: -0.17px;
    margin: 0;
  }
`;

const DatasourceCardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;
  text-align: center;
  min-width: 150px;
  border-radius: 4px;
  align-items: center;
`;

const DatasourceCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
  &:hover {
    background: ${Colors.Gallery};
    cursor: pointer;
  }

  .dataSourceImageWrapper {
    width: 40px;
    height: 40px;
    border-radius: 20px;
    margin: 0 8px;
    background: #f0f0f0;
    display: flex;
    align-items: center;

    .dataSourceImage {
      height: 28px;
      width: auto;
      margin: 0 auto;
      max-width: 100%;
      margin-bottom: 2px;
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
`;

interface DatasourceHomeScreenProps {
  pageId: string;
  applicationId: string;
  location: {
    search: string;
  };
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
}

interface ReduxDispatchProps {
  initializeForm: (data: Record<string, any>) => void;
  createDatasource: (data: any) => void;
}

interface ReduxStateProps {
  plugins: Plugin[];
  currentApplication?: ApplicationPayload;
  pluginImages: Record<string, string>;
  isSaving: boolean;
}

type Props = ReduxStateProps & DatasourceHomeScreenProps & ReduxDispatchProps;

class DatasourceHomeScreen extends React.Component<Props> {
  goToCreateDatasource = (pluginId: string, pluginName: string) => {
    const { currentApplication } = this.props;

    AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
      appName: currentApplication?.name,
      plugin: pluginName,
    });

    this.props.createDatasource({
      pluginId,
    });
  };

  render() {
    const { pluginImages, plugins } = this.props;

    return (
      <DatasourceHomePage>
        <DatasourceCardsContainer>
          {plugins.map((plugin, idx) => {
            return (
              <DatasourceCard
                className="eachDatasourceCard"
                key={`${plugin.id}_${idx}`}
                onClick={() =>
                  this.goToCreateDatasource(plugin.id, plugin.name)
                }
              >
                <DatasourceContentWrapper>
                  <div className="dataSourceImageWrapper">
                    <img
                      alt="Datasource"
                      className="dataSourceImage"
                      src={pluginImages[plugin.id]}
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
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    initializeForm: (data: Record<string, any>) =>
      dispatch(initialize(DATASOURCE_DB_FORM, data)),
    createDatasource: (data: any) => dispatch(createDatasourceFromForm(data)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DatasourceHomeScreen);
