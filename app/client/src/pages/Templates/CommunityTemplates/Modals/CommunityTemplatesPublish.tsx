import {
  COMMUNITY_TEMPLATES,
  LEARN_MORE,
  createMessage,
} from "@appsmith/constants/messages";
import { Button, Icon, Text } from "design-system";
import React from "react";
import history from "utils/history";
import styled from "styled-components";
import { builderURL } from "RouteBuilder";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";

type Props = {
  setShowHostModal: (showModal: boolean) => void;
};
const CommunityTemplatesPublish = ({ setShowHostModal }: Props) => {
  const isPublished = false;
  return isPublished ? (
    <PublishedAppInstructions />
  ) : (
    <UnPublishedAppInstructions setShowHostModal={setShowHostModal} />
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
const UnPublishedAppInstructions = ({ setShowHostModal }: Props) => {
  const pageId = useSelector(getCurrentPageId);

  const takeUserToPublishFormPage = () => {
    history.push(
      builderURL({
        pageId,
        persistExistingParams: true,
        suffix: "publish/community-template",
      }),
    );
    setShowHostModal(false);
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
