import React from "react";
import styled from "styled-components";
import { importSvg } from "design-system-old";
import { Text } from "design-system";
import {
  createMessage,
  DATASOURCE_BLANK_STATE_MESSAGE,
} from "@appsmith/constants/messages";
import { Redirect } from "react-router";
import { useSelector } from "react-redux";
import { getFirstDatasourceId } from "selectors/datasourceSelectors";

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

const DatasourceBlankState = () => {
  const firstDatasourceId = useSelector(getFirstDatasourceId);

  if (firstDatasourceId) {
    return <Redirect to={`${location.pathname}/${firstDatasourceId}`} />;
  }

  return (
    <Container className="t--data-blank-state">
      <Content>
        <BlankStateIllustration />
        <Text kind="body-s">
          {createMessage(DATASOURCE_BLANK_STATE_MESSAGE)}
        </Text>
      </Content>
    </Container>
  );
};

export default DatasourceBlankState;
