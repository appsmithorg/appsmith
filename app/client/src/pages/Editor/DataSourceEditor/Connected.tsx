import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import type { AppState } from "@appsmith/reducers";
import { getDatasource, getPlugin } from "selectors/entitiesSelector";
import styled from "styled-components";
import NewActionButton from "./NewActionButton";

import { hasCreateDatasourceActionPermission } from "@appsmith/utils/permissionHelpers";
import { getPagePermissions } from "selectors/editorSelectors";
import { Icon } from "design-system";

const ConnectedText = styled.div`
  color: var(--ads-v2-color-fg);
  font-size: 17px;
  font-weight: bold;
  display: flex;
  align-items: center;
`;

const Header = styled.div`
  flex-direction: row;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

function Connected({
  errorComponent,
  showDatasourceSavedText = true,
}: {
  errorComponent?: JSX.Element | null;
  hideDatasourceRenderSection?: boolean;
  showDatasourceSavedText?: boolean;
}) {
  const params = useParams<{ datasourceId: string }>();

  const datasource = useSelector((state: AppState) =>
    getDatasource(state, params.datasourceId),
  );

  const plugin = useSelector((state: AppState) =>
    getPlugin(state, datasource?.pluginId ?? ""),
  );

  const datasourcePermissions = datasource?.userPermissions || [];

  const pagePermissions = useSelector(getPagePermissions);

  const canCreateDatasourceActions = hasCreateDatasourceActionPermission([
    ...datasourcePermissions,
    ...pagePermissions,
  ]);

  return (
    <>
      {showDatasourceSavedText && (
        <Header>
          <ConnectedText>
            <Icon
              color="var(--ads-v2-color-fg-success)"
              name="success"
              size="lg"
            />
            <div style={{ marginLeft: "12px" }}>Datasource saved</div>
          </ConnectedText>
          <NewActionButton
            datasource={datasource}
            disabled={!canCreateDatasourceActions}
            eventFrom="datasource-pane"
            plugin={plugin}
          />
        </Header>
      )}
      {errorComponent}
    </>
  );
}

export default Connected;
