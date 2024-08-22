import React, { useMemo } from "react";

import { thinScrollbar } from "constants/DefaultTheme";
import {
  EMPTY_ACTIVE_DATA_SOURCES,
  createMessage,
} from "ee/constants/messages";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { AppState } from "ee/reducers";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { getHasCreateDatasourcePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import type { Datasource } from "entities/Datasource";
import { keyBy } from "lodash";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

import { Button } from "@appsmith/ads";
import { Text, TextType } from "@appsmith/ads-old";

import DatasourceCard from "./DatasourceCard";

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

interface ActiveDataSourcesProps {
  dataSources: Datasource[];
  basePageId: string;
  location: {
    search: string;
  };
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
  onCreateNew: () => void;
}

function ActiveDataSources(props: ActiveDataSourcesProps) {
  const { dataSources } = props;
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);

  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state).userPermissions ?? [],
  );

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateDatasource = getHasCreateDatasourcePermission(
    isFeatureEnabled,
    userWorkspacePermissions,
  );

  if (dataSources.length === 0) {
    return (
      <EmptyActiveDatasource>
        <Text data-testid="t--empty-datasource-list" type={TextType.H3}>
          {createMessage(EMPTY_ACTIVE_DATA_SOURCES)}
        </Text>
        <Button
          isDisabled={!canCreateDatasource}
          onClick={props.onCreateNew}
          size="md"
        >
          Create new
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
