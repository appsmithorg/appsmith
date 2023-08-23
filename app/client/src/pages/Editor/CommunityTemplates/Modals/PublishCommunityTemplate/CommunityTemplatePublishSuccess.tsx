import React from "react";
import { PublishPageBodyContainer } from "./StyledComponents";
import { Button, Text } from "design-system";
import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import styled from "styled-components";

const CommunityTemplatePublishSuccess = () => {
  return (
    <PublishPageBodyContainer>
      <Container>
        <Text kind="heading-s" renderAs="h2">
          {createMessage(COMMUNITY_TEMPLATES.publishSuccessPage.title)}
        </Text>
        <Text kind="body-m" renderAs="p">
          {createMessage(COMMUNITY_TEMPLATES.publishSuccessPage.description)}
        </Text>
        <Button endIcon="external-link-line" kind="secondary" size="md">
          {createMessage(
            COMMUNITY_TEMPLATES.publishSuccessPage.viewTemplateButton,
          )}
        </Button>
      </Container>
    </PublishPageBodyContainer>
  );
};

export default CommunityTemplatePublishSuccess;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  button {
    align-self: flex-start;
  }
`;
