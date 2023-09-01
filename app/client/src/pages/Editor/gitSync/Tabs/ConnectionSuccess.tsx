import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
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
              Add deploy key & give write access
            </TitleText>
          </TitleContainer>
          <Text renderAs="p">
            Now you can start collaborating with your team members by committing
            ,merging and deploying your app
          </Text>
        </Container>
      </ModalBody>
      <ModalFooter>
        <Button onClick={handleClose} size="md">
          Start using git
        </Button>
      </ModalFooter>
    </>
  );
}

export default ConnectionSuccess;
