import React from "react";
import styled from "styled-components";
import DataSourceHome from "./DatasourceHome";
import type { ActionParentEntityTypeInterface } from "@appsmith/entities/Engine/actionHelpers";

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
  editorId: string;
  editorType: string;
  parentEntityId: string;
  parentEntityType: ActionParentEntityTypeInterface;
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
      editorId,
      editorType,
      history,
      isCreating,
      location,
      parentEntityId,
      parentEntityType,
      showMostPopularPlugins,
      showUnsupportedPluginDialog,
    } = this.props;

    return (
      <QueryHomePage>
        <DataSourceHome
          editorId={editorId}
          editorType={editorType}
          history={history}
          isCreating={isCreating}
          location={location}
          parentEntityId={parentEntityId}
          parentEntityType={parentEntityType}
          showMostPopularPlugins={showMostPopularPlugins}
          showUnsupportedPluginDialog={showUnsupportedPluginDialog}
        />
      </QueryHomePage>
    );
  }
}

export default QueryHomeScreen;
