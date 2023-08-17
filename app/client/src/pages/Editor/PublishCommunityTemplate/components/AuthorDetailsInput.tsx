import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import { Input, Text } from "design-system";
import React from "react";
import styled from "styled-components";

const AuthorDetailsInput = () => {
  return (
    <Container>
      <Text kind="heading-s" renderAs="h2">
        {createMessage(COMMUNITY_TEMPLATES.publishFormPage.authorDetails.title)}
      </Text>
      <Input
        isRequired
        label={createMessage(
          COMMUNITY_TEMPLATES.publishFormPage.authorDetails.displayNameLabel,
        )}
        labelPosition="top"
        placeholder={createMessage(
          COMMUNITY_TEMPLATES.publishFormPage.authorDetails
            .displayNamePlaceholder,
        )}
        renderAs="input"
        size="md"
        type="text"
      />
      <Input
        isRequired
        label={createMessage(
          COMMUNITY_TEMPLATES.publishFormPage.authorDetails.emailLabel,
        )}
        labelPosition="top"
        placeholder={createMessage(
          COMMUNITY_TEMPLATES.publishFormPage.authorDetails.emailPlaceholder,
        )}
        renderAs="input"
        size="md"
        type="text"
      />
    </Container>
  );
};

export default AuthorDetailsInput;
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
