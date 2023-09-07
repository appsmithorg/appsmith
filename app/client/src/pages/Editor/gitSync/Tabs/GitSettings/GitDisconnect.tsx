import { DANGER_ZONE, createMessage } from "@appsmith/constants/messages";
import {
  setDisconnectingGitApplication,
  setIsDisconnectGitModalOpen,
  setIsGitSyncModalOpen,
} from "actions/gitSyncActions";
import { Button, Text } from "design-system";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplication } from "selectors/editorSelectors";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";

const Container = styled.div`
  padding-top: 16px;
  padding-bottom: 16px;
`;

const HeadContainer = styled.div`
  margin-bottom: 16px;
`;

const BodyContainer = styled.div`
  display: flex;
`;

const BodyInnerContainer = styled.div`
  flex: 1;
  margin-right: 32px;
`;

const SectionTitle = styled(Text)`
  font-weight: 600;
`;

function GitDisconnect() {
  const dispatch = useDispatch();
  const currentApp = useSelector(getCurrentApplication);

  const handleDisconnect = () => {
    AnalyticsUtil.logEvent("GS_DISCONNECT_GIT_CLICK", {
      source: "GIT_CONNECTION_MODAL",
    });
    dispatch(setIsGitSyncModalOpen({ isOpen: false }));
    dispatch(
      setDisconnectingGitApplication({
        id: currentApp?.id || "",
        name: currentApp?.name || "",
      }),
    );
    dispatch(setIsDisconnectGitModalOpen(true));
  };

  return (
    <Container>
      <HeadContainer>
        <SectionTitle kind="heading-s">
          {createMessage(DANGER_ZONE)}
        </SectionTitle>
      </HeadContainer>
      <BodyContainer>
        <BodyInnerContainer>
          <Text kind="heading-xs" renderAs="p">
            Disconnect Git
          </Text>
          <Text renderAs="p">
            Once you disconnect from a repository, there is no going back.
            <br />
            Please be certain.
          </Text>
        </BodyInnerContainer>
        <Button kind="error" onClick={handleDisconnect} size="md">
          Disconnect Git
        </Button>
      </BodyContainer>
    </Container>
  );
}

export default GitDisconnect;
