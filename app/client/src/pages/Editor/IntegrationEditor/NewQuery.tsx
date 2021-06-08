import React from "react";
import styled from "styled-components";
import { Spinner } from "@blueprintjs/core";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { getPluginImages } from "selectors/entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { createActionRequest } from "actions/actionActions";
import { Page } from "constants/ReduxActionConstants";
import {
  QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  DATA_SOURCES_EDITOR_URL,
} from "constants/routes";
import AddDatasourceSecurely from "./AddDatasourceSecurely";
import { QueryAction } from "entities/Action";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";

const QueryHomePage = styled.div`
  padding: 5px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  height: calc(100vh - ${(props) => props.theme.smallHeaderHeight});

  .sectionHeader {
    font-weight: ${(props) => props.theme.fontWeights[2]};
    font-size: ${(props) => props.theme.fontSizes[4]}px;
    margin-top: 10px;
  }
`;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

const Boundary = styled.hr`
  border: 1px solid #d0d7dd;
  margin-top: 16px;
`;

type QueryHomeScreenProps = {
  applicationId: string;
  pageId: string;
  createAction: (data: Partial<QueryAction> & { eventData: any }) => void;
  actions: ActionDataState;
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
  render() {
    const { applicationId, history, isCreating, location, pageId } = this.props;

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
        <Boundary />
        <AddDatasourceSecurely
          onAddDatasource={() => {
            history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId));
          }}
        />
      </QueryHomePage>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  pluginImages: getPluginImages(state),
  actions: state.entities.actions,
  pages: state.entities.pageList.pages,
});

const mapDispatchToProps = (dispatch: any) => ({
  createAction: (data: Partial<QueryAction> & { eventData: any }) => {
    dispatch(createActionRequest(data));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(QueryHomeScreen);
