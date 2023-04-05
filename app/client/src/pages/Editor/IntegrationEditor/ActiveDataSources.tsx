import React, { useMemo } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import type { Datasource } from "entities/Datasource";
import DatasourceCard from "./DatasourceCard";
import { Text, TextType } from "design-system-old";
import { Button } from "design-system";
import { thinScrollbar } from "constants/DefaultTheme";
import { keyBy } from "lodash";
import {
  createMessage,
  EMPTY_ACTIVE_DATA_SOURCES,
} from "@appsmith/constants/messages";
import { hasCreateDatasourcePermission } from "@appsmith/utils/permissionHelpers";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";

const QueryHomePage = styled.div`
  ${thinScrollbar};
  overflow: auto;
  display: flex;
  flex-direction: column;
  flex: 1;

  .sectionHeader {
    font-weight: ${(props) => props.theme.fontWeights[2]};
    font-size: ${(props) => props.theme.fontSizes[4]}px;
    margin-top: 10px;
  }
`;

const EmptyActiveDatasource = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

type ActiveDataSourcesProps = {
  dataSources: Datasource[];
  pageId: string;
  location: {
    search: string;
  };
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
  onCreateNew: () => void;
};

function ActiveDataSources(props: ActiveDataSourcesProps) {
  const { dataSources } = props;
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);

  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state).userPermissions ?? [],
  );

  const canCreateDatasource = hasCreateDatasourcePermission(
    userWorkspacePermissions,
  );

  if (dataSources.length === 0) {
    return (
      <EmptyActiveDatasource>
        <Text cypressSelector="t--empty-datasource-list" type={TextType.H3}>
          {createMessage(EMPTY_ACTIVE_DATA_SOURCES)}
        </Text>
        <Button
          isDisabled={!canCreateDatasource}
          onClick={props.onCreateNew}
          size="md"
        >
          Create New
        </Button>
      </EmptyActiveDatasource>
    );
  }

  return (
    <QueryHomePage className="t--active-datasource-list">
      {dataSources.map((datasource, idx) => {
        return (
          <DatasourceCard
            datasource={datasource}
            key={`${datasource.id}_${idx}`}
            plugin={pluginGroups[datasource.pluginId]}
          />
        );
      })}
    </QueryHomePage>
  );
}

export default ActiveDataSources;
