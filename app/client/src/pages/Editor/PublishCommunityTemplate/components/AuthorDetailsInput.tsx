import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import { Input, Text } from "design-system";
import React from "react";
import styled from "styled-components";

type Props = {
  authorEmail: string;
  authorName: string;
  disableEmail: boolean;
  disableName: boolean;
  setAuthorEmail: React.Dispatch<string>;
  setAuthorName: React.Dispatch<string>;
};
const AuthorDetailsInput = ({
  authorEmail,
  authorName,
  disableEmail,
  disableName,
  setAuthorEmail,
  setAuthorName,
}: Props) => {
  return (
    <Container>
      <Text kind="heading-s" renderAs="h2">
        {createMessage(COMMUNITY_TEMPLATES.publishFormPage.authorDetails.title)}
      </Text>
      <Input
        defaultValue={authorName}
        isDisabled={disableName}
        isRequired
        label={createMessage(
          COMMUNITY_TEMPLATES.publishFormPage.authorDetails.displayNameLabel,
        )}
        labelPosition="top"
        onChange={setAuthorName}
        placeholder={createMessage(
          COMMUNITY_TEMPLATES.publishFormPage.authorDetails
            .displayNamePlaceholder,
        )}
        renderAs="input"
        size="md"
        type="text"
      />
      <Input
        defaultValue={authorEmail}
        isDisabled={disableEmail}
        isRequired
        label={createMessage(
          COMMUNITY_TEMPLATES.publishFormPage.authorDetails.emailLabel,
        )}
        labelPosition="top"
        onChange={setAuthorEmail}
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
