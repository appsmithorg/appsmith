import {
  COMMUNITY_TEMPLATES,
  LEARN_MORE,
  createMessage,
} from "@appsmith/constants/messages";
import { Button, Icon, Text } from "design-system";
import React from "react";
import styled from "styled-components";

type Props = {
  onPublishClick: () => void;
  setShowHostModal: (showModal: boolean) => void;
};
const CommunityTemplatesPublishInfo = ({
  onPublishClick,
  setShowHostModal,
}: Props) => {
  const isPublished = true;
  return isPublished ? (
    <PublishedAppInstructions />
  ) : (
    <UnPublishedAppInstructions
      onPublishClick={onPublishClick}
      setShowHostModal={setShowHostModal}
    />
  );
};

export default CommunityTemplatesPublishInfo;

const PublishedAppInstructions = () => {
  return (
    <>
      <InfoContainer>
        <VerticalCenterContainer>
          <Icon color="green" name="oval-check" size="md" />{" "}
          <Text kind="heading-s" renderAs="h2">
            {createMessage(COMMUNITY_TEMPLATES.modals.publishedInfo.title)}
          </Text>
        </VerticalCenterContainer>
        <Text kind="body-m" renderAs="p">
          {createMessage(COMMUNITY_TEMPLATES.modals.publishedInfo.description)}
        </Text>
      </InfoContainer>
      <InfoFooter>
        <Button endIcon="link" size="md">
          {createMessage(COMMUNITY_TEMPLATES.modals.publishedInfo.viewTemplate)}
        </Button>
      </InfoFooter>
    </>
  );
};

const UnPublishedAppInstructions = ({
  onPublishClick,
  setShowHostModal,
}: Props) => {
  const takeUserToPublishFormPage = () => {
    setShowHostModal(false);
    onPublishClick();
  };
  return (
    <>
      <InfoContainer>
        <Text kind="heading-s" renderAs="h2">
          {createMessage(COMMUNITY_TEMPLATES.modals.unpublishedInfo.title)}
        </Text>
        <Text kind="body-m" renderAs="p">
          {createMessage(
            COMMUNITY_TEMPLATES.modals.unpublishedInfo.description,
          )}
        </Text>
      </InfoContainer>
      <InfoFooter>
        <Button endIcon="link" kind="tertiary" size="md">
          {createMessage(LEARN_MORE)}
        </Button>
        <Button
          data-testid="t--Publish-Initiate"
          onClick={takeUserToPublishFormPage}
          size="md"
        >
          {createMessage(COMMUNITY_TEMPLATES.publish)}
        </Button>
      </InfoFooter>
    </>
  );
};

const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 250px;
  padding-top: var(--ads-v2-spaces-2);
`;
const InfoFooter = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  align-items: center;
`;
const VerticalCenterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
