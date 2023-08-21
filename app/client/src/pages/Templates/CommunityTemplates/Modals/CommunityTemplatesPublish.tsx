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
const CommunityTemplatesPublish = ({
  onPublishClick,
  setShowHostModal,
}: Props) => {
  const isPublished = false;
  return isPublished ? (
    <PublishedAppInstructions />
  ) : (
    <UnPublishedAppInstructions
      onPublishClick={onPublishClick}
      setShowHostModal={setShowHostModal}
    />
  );
};

export default CommunityTemplatesPublish;

const PublishedAppInstructions = () => {
  return (
    <section>
      <InfoContainer>
        <Text kind="heading-s" renderAs="h2">
          <Icon name="checkbox-circle-line" size="md" />{" "}
          {createMessage(COMMUNITY_TEMPLATES.modals.publishedInfo.title)}
        </Text>
        <Text kind="body-m" renderAs="p">
          {createMessage(COMMUNITY_TEMPLATES.modals.publishedInfo.description)}
        </Text>
      </InfoContainer>
      <InfoFooter>
        <Button endIcon="external-link-line" size="md">
          {createMessage(COMMUNITY_TEMPLATES.modals.publishedInfo.viewTemplate)}
        </Button>
      </InfoFooter>
    </section>
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
    <section>
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
        <Button endIcon="external-link-line" kind="tertiary" size="md">
          {createMessage(LEARN_MORE)}
        </Button>
        <Button onClick={takeUserToPublishFormPage} size="md">
          {createMessage(COMMUNITY_TEMPLATES.publish)}
        </Button>
      </InfoFooter>
    </section>
  );
};

const InfoContainer = styled.div`
  min-height: 250px;
`;
const InfoFooter = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  align-items: center;
`;
