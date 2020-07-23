import React from "react";
import styled from "styled-components";
import { Icon, Card, Spinner } from "@blueprintjs/core";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { createNewQueryName } from "utils/AppsmithUtils";
import {
  getPluginIdsOfPackageNames,
  getPluginImages,
} from "selectors/entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { Datasource } from "api/DatasourcesApi";
import history from "utils/history";
import { createActionRequest } from "actions/actionActions";
import { PLUGIN_PACKAGE_DBS } from "constants/QueryEditorConstants";
import { Page } from "constants/ReduxActionConstants";
import {
  QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  DATA_SOURCES_EDITOR_URL,
} from "constants/routes";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { QueryAction } from "entities/Action";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";

const QueryHomePage = styled.div`
  font-size: 20px;
  padding: 20px;
  max-height: 95vh;
  overflow: auto;

  .addIcon {
    align-items: center;
    margin-top: 15px;
    margin-bottom: 20px;
  }

  .createText {
    font-size: 14px;
    justify-content: center;
    text-align: center;
    letter-spacing: -0.17px;
    color: #2e3d49;
    font-weight: 500;
    text-decoration: none !important;
  }

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

const CardsWrapper = styled.div`
  flex: 1;
  display: -webkit-box;
  flex-wrap: wrap;
  -webkit-box-pack: start !important;
  justify-content: center;
  text-align: center;
  min-width: 140px;
  border-radius: 4px;
  .createCard {
    margin-right: 20px;
    margin-top: 10px;
    margin-bottom: 10px;
    width: 140px;
    height: 110px;
    padding-bottom: 0px;
    cursor: pointer !important;
  }
`;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
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
    margin-bottom: 7px;
  }
`;

type QueryHomeScreenProps = {
  dataSources: Datasource[];
  applicationId: string;
  pageId: string;
  createAction: (data: Partial<QueryAction>) => void;
  actions: ActionDataState;
  pluginIds: Array<string> | undefined;
  isCreating: boolean;
  location: {
    search: string;
  };
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
  pages: Page[];
  pluginImages: Record<string, string>;
};

class QueryHomeScreen extends React.Component<QueryHomeScreenProps> {
  handleCreateNewQuery = (dataSourceId: string, params: string) => {
    const { actions, pages, applicationId } = this.props;
    const pageId = new URLSearchParams(params).get("importTo");
    const page = pages.find(page => page.pageId === pageId);

    AnalyticsUtil.logEvent("CREATE_QUERY_CLICK", {
      pageName: page?.pageName ?? "",
    });
    if (pageId) {
      const newQueryName = createNewQueryName(actions, pageId);

      history.push(
        QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID(applicationId, pageId, pageId),
      );
      this.props.createAction({
        name: newQueryName,
        pageId,
        datasource: {
          id: dataSourceId,
        },
        actionConfiguration: {},
      });
    }
  };

  render() {
    const {
      dataSources,
      pluginIds,
      applicationId,
      pageId,
      history,
      location,
      isCreating,
      pluginImages,
    } = this.props;

    const queryParams: string = location.search;
    const destinationPageId = new URLSearchParams(location.search).get(
      "importTo",
    );

    if (!destinationPageId) {
      history.push(
        QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID(applicationId, pageId, pageId),
      );
    }

    if (isCreating) {
      return (
        <LoadingContainer>
          <Spinner size={30} />
        </LoadingContainer>
      );
    }

    return (
      <QueryHomePage>
        <p style={{ fontSize: "14px" }}>Create Query</p>
        <CardsWrapper>
          <DatasourceCardsContainer>
            <Card
              interactive={false}
              className="eachDatasourceCard"
              onClick={() => {
                if (dataSources.length) {
                  this.handleCreateNewQuery(dataSources[0].id, queryParams);
                } else {
                  history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId));
                }
              }}
            >
              <Icon icon="plus" iconSize={25} className="addIcon" />
              <p className="createText">Blank Query</p>
            </Card>
            {dataSources.map(dataSource => {
              return (
                <Card
                  interactive={false}
                  className="eachDatasourceCard"
                  key={dataSource.id}
                  onClick={() =>
                    this.handleCreateNewQuery(dataSource.id, queryParams)
                  }
                >
                  <img
                    src={pluginImages[dataSource.pluginId]}
                    className="dataSourceImage"
                    alt="Datasource"
                  />

                  <p
                    className="textBtn t--datasource-name"
                    title={dataSource.name}
                  >
                    {dataSource.name}
                  </p>
                </Card>
              );
            })}
          </DatasourceCardsContainer>
        </CardsWrapper>
      </QueryHomePage>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  pluginIds: getPluginIdsOfPackageNames(state, PLUGIN_PACKAGE_DBS),
  pluginImages: getPluginImages(state),
  actions: state.entities.actions,
  pages: state.entities.pageList.pages,
});

const mapDispatchToProps = (dispatch: any) => ({
  createAction: (data: Partial<QueryAction>) => {
    dispatch(createActionRequest(data));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(QueryHomeScreen);
