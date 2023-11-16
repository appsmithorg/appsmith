import React from "react";
import styled from "styled-components";
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

interface QueryHomeScreenProps {
  pageId: string;
  isCreating: boolean;
  location: {
    search: string;
  };
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
  showMostPopularPlugins?: boolean;
  showUnsupportedPluginDialog: (callback: any) => void;
}

class QueryHomeScreen extends React.Component<QueryHomeScreenProps> {
  render() {
    const {
      history,
      isCreating,
      location,
      pageId,
      showMostPopularPlugins,
      showUnsupportedPluginDialog,
    } = this.props;

    return (
      <QueryHomePage>
        <DataSourceHome
          history={history}
          isCreating={isCreating}
          location={location}
          pageId={pageId}
          showMostPopularPlugins={showMostPopularPlugins}
          showUnsupportedPluginDialog={showUnsupportedPluginDialog}
        />
      </QueryHomePage>
    );
  }
}

export default QueryHomeScreen;
