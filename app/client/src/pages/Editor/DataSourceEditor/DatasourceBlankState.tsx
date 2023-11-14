import React from "react";
import styled from "styled-components";
import { importSvg } from "design-system-old";
import { Button, Text } from "design-system";
import {
  createMessage,
  DATASOURCE_BLANK_STATE_MESSAGE,
} from "@appsmith/constants/messages";
import history from "utils/history";
import { integrationEditorURL } from "@appsmith/RouteBuilder";
import type { RouteComponentProps } from "react-router";
import { INTEGRATION_TABS } from "constants/routes";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasCreateDatasourcePermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";

const Container = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Content = styled.div`
  width: 243px;
  gap: 24px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const BlankStateIllustration = importSvg(
  async () => import("assets/images/data-main-blank-state.svg"),
);

const DatasourceBlankState = (
  props: RouteComponentProps<{
    pageId: string;
  }>,
) => {
  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state).userPermissions ?? [],
  );

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateDatasource = getHasCreateDatasourcePermission(
    isFeatureEnabled,
    userWorkspacePermissions,
  );
  return (
    <Container className="t--data-blank-state">
      <Content>
        <BlankStateIllustration />
        <Text kind="body-s">
          {createMessage(DATASOURCE_BLANK_STATE_MESSAGE)}
        </Text>
        {canCreateDatasource && (
          <Button
            kind="primary"
            onClick={() =>
              history.push(
                integrationEditorURL({
                  pageId: props.match.params.pageId,
                  selectedTab: INTEGRATION_TABS.NEW,
                }),
              )
            }
          >
            Bring your data
          </Button>
        )}
      </Content>
    </Container>
  );
};

export default DatasourceBlankState;
