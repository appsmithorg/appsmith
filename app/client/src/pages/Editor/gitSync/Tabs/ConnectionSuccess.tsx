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
import { useDispatch } from "react-redux";
import styled from "styled-components";

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
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(
      setIsGitSyncModalOpen({
        isOpen: true,
        tab: GitSyncModalTab.DEPLOY,
      }),
    );
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
        <Button onClick={handleClose} size="md">
          {createMessage(START_USING_GIT)}
        </Button>
      </ModalFooter>
    </>
  );
}

export default ConnectionSuccess;
