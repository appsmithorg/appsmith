import React from "react";
import styled from "styled-components";
import DataSourceHome from "./DatasourceHome";
import type { ActionParentEntityTypeInterface } from "ee/entities/Engine/actionHelpers";

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
  showMostPopularPlugins?: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showUnsupportedPluginDialog: (callback: any) => void;
  isAirgappedInstance?: boolean;
}

class QueryHomeScreen extends React.Component<QueryHomeScreenProps> {
  render() {
    const {
      editorId,
      editorType,
      isAirgappedInstance,
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
          isAirgappedInstance={isAirgappedInstance}
          isCreating={isCreating}
          location={location}
          parentEntityId={parentEntityId}
          parentEntityType={parentEntityType}
          showMostPopularPlugins={showMostPopularPlugins}
          showUnsupportedPluginDialog={showUnsupportedPluginDialog}
        >
          {this.props.children}
        </DataSourceHome>
      </QueryHomePage>
    );
  }
}

export default QueryHomeScreen;
