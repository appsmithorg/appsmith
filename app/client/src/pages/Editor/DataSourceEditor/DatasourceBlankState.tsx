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
  return (
    <Container className="t--data-blank-state">
      <Content>
        <BlankStateIllustration />
        <Text kind="body-s">
          {createMessage(DATASOURCE_BLANK_STATE_MESSAGE)}
        </Text>
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
      </Content>
    </Container>
  );
};

export default DatasourceBlankState;
