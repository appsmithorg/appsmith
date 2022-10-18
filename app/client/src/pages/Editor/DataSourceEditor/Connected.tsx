import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { AppState } from "@appsmith/reducers";
import { isNil } from "lodash";
import { getDatasource, getPlugin } from "selectors/entitiesSelector";
import { Colors } from "constants/Colors";
import { HeaderIcons } from "icons/HeaderIcons";
import styled from "styled-components";
import { renderDatasourceSection } from "./DatasourceSection";
import NewActionButton from "./NewActionButton";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";

import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { getPagePermissions } from "selectors/editorSelectors";

const ConnectedText = styled.div`
  color: ${Colors.OXFORD_BLUE};
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

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid #d0d7dd;
  border-bottom: 1px solid #d0d7dd;
  padding-top: 24px;
  padding-bottom: 24px;
  margin-top: 18px;
`;

function Connected() {
  const params = useParams<{ datasourceId: string }>();
  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state).userPermissions ?? [],
  );
  const pagePermissions = useSelector(getPagePermissions);

  const canCreateDatasourceActions = isPermitted(
    [...userWorkspacePermissions, ...pagePermissions],
    [PERMISSION_TYPE.CREATE_DATASOURCE_ACTIONS, PERMISSION_TYPE.CREATE_ACTIONS],
  );

  const datasource = useSelector((state: AppState) =>
    getDatasource(state, params.datasourceId),
  );

  const datasourceFormConfigs = useSelector(
    (state: AppState) => state.entities.plugins.formConfigs,
  );

  const plugin = useSelector((state: AppState) =>
    getPlugin(state, datasource?.pluginId ?? ""),
  );

  const currentFormConfig: Array<any> =
    datasourceFormConfigs[datasource?.pluginId ?? ""];

  return (
    <Wrapper>
      <Header>
        <ConnectedText>
          <HeaderIcons.SAVE_SUCCESS
            color={Colors.GREEN}
            height={30}
            width={30}
          />

          <div style={{ marginLeft: "12px" }}>Datasource Saved</div>
        </ConnectedText>

        <NewActionButton
          datasource={datasource}
          disabled={!canCreateDatasourceActions}
          eventFrom="datasource-pane"
          plugin={plugin}
        />
      </Header>
      <div style={{ marginTop: "30px" }}>
        {!isNil(currentFormConfig) && !isNil(datasource)
          ? renderDatasourceSection(currentFormConfig[0], datasource)
          : undefined}
      </div>
    </Wrapper>
  );
}

export default Connected;
