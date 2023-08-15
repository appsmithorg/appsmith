import {
  COMMUNITY_TEMPLATES,
  LEARN_MORE,
  createMessage,
} from "@appsmith/constants/messages";
import { Text, Button, Icon } from "design-system";
import React from "react";
import styled from "styled-components";

const CommunityTemplatesPublish = () => {
  const isPublished = true;
  return isPublished ? (
    <PublishedAppInstructions />
  ) : (
    <UnPublishedAppInstructions />
  );
};

export default CommunityTemplatesPublish;

const PublishedAppInstructions = () => {
  return (
    <section>
      <InfoContainer>
        <Text kind="heading-s" renderAs="h2">
          <Icon name="checkbox-circle-line" size="md" />{" "}
          {createMessage(COMMUNITY_TEMPLATES.publishedInfo.title)}
        </Text>
        <Text kind="body-m" renderAs="p">
          {createMessage(COMMUNITY_TEMPLATES.publishedInfo.description)}
        </Text>
      </InfoContainer>
      <InfoFooter>
        <Button endIcon="external-link-line" size="md">
          {createMessage(COMMUNITY_TEMPLATES.publishedInfo.viewTemplate)}
        </Button>
      </InfoFooter>
    </section>
  );
};
const UnPublishedAppInstructions = () => {
  return (
    <section>
      <InfoContainer>
        <Text kind="heading-s" renderAs="h2">
          {createMessage(COMMUNITY_TEMPLATES.unpublishedInfo.title)}
        </Text>
        <Text kind="body-m" renderAs="p">
          {createMessage(COMMUNITY_TEMPLATES.unpublishedInfo.description)}
        </Text>
      </InfoContainer>
      <InfoFooter>
        <Button endIcon="external-link-line" kind="tertiary" size="md">
          {createMessage(LEARN_MORE)}
        </Button>
        <Button size="md">{createMessage(COMMUNITY_TEMPLATES.publish)}</Button>
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
