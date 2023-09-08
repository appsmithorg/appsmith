import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import {
  GIT_CONNECT_SUCCESS_MESSAGE,
  GIT_CONNECT_SUCCESS_TITLE,
  START_USING_GIT,
  createMessage,
} from "@appsmith/constants/messages";
import { Button, Icon, ModalBody, ModalFooter, Text } from "design-system";
import { GitSyncModalTab } from "entities/GitSync";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { getCurrentAppGitMetaData } from "@appsmith/selectors/applicationSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";

const Container = styled.div``;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const TitleText = styled(Text)`
  flex: 1;
  font-weight: 600;
`;

const StyledIcon = styled(Icon)`
  margin-right: 8px;
`;

function ConnectionSuccess() {
  const gitMetadata = useSelector(getCurrentAppGitMetaData);
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(
      setIsGitSyncModalOpen({
        isOpen: true,
        tab: GitSyncModalTab.DEPLOY,
      }),
    );
    AnalyticsUtil.logEvent("GS_START_USING_GIT", {
      repoUrl: gitMetadata?.remoteUrl,
    });
  };

  return (
    <>
      <ModalBody>
        <Container>
          <TitleContainer>
            <StyledIcon color="#059669" name="oval-check" size="lg" />
            <TitleText kind="heading-s" renderAs="h3">
              {createMessage(GIT_CONNECT_SUCCESS_TITLE)}
            </TitleText>
          </TitleContainer>
          <Text renderAs="p">{createMessage(GIT_CONNECT_SUCCESS_MESSAGE)}</Text>
        </Container>
      </ModalBody>
      <ModalFooter>
        <Button
          data-testid="t--start-using-git-button"
          onClick={handleClose}
          size="md"
        >
          {createMessage(START_USING_GIT)}
        </Button>
      </ModalFooter>
    </>
  );
}

export default ConnectionSuccess;
