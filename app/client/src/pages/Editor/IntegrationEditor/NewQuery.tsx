import React from "react";
import styled from "styled-components";
import { Spinner } from "@blueprintjs/core";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { getPluginImages } from "selectors/entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { createActionRequest } from "actions/actionActions";
import { Page } from "constants/ReduxActionConstants";
import { QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID } from "constants/routes";
import { QueryAction } from "entities/Action";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import DataSourceHome from "./DatasourceHome";

const QueryHomePage = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  .sectionHeader {
    font-weight: ${(props) => props.theme.fontWeights[2]};
    font-size: ${(props) => props.theme.fontSizes[4]}px;
    margin-top: 10px;
  }
`;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
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
        <DataSourceHome
          applicationId={applicationId}
          history={history}
          location={location}
          pageId={pageId}
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
