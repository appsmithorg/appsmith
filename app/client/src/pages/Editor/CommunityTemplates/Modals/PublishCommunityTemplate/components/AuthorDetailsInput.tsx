import {
  COMMUNITY_TEMPLATES,
  FORM_VALIDATION_INVALID_EMAIL,
  createMessage,
} from "ee/constants/messages";
import { Input, Text } from "@appsmith/ads";
import { emailValidator } from "@appsmith/ads-old";
import React, { useMemo } from "react";
import styled from "styled-components";

interface Props {
  authorEmail: string;
  authorName: string;
  disableEmail: boolean;
  disableName: boolean;
  setAuthorEmail: React.Dispatch<string>;
  setAuthorName: React.Dispatch<string>;
}
const AuthorDetailsInput = ({
  authorEmail,
  authorName,
  disableEmail,
  disableName,
  setAuthorEmail,
  setAuthorName,
}: Props) => {
  const isEmailValid = useMemo(
    () => authorEmail && emailValidator(authorEmail).isValid,
    [authorEmail],
  );

  return (
    <Container>
      <Text kind="heading-s" renderAs="h2">
        {createMessage(COMMUNITY_TEMPLATES.publishFormPage.authorDetails.title)}
      </Text>
      <Input
        data-testid="t--community-template-author-name-input"
        defaultValue={authorName}
        errorMessage={
          authorName.length > 0
            ? ""
            : createMessage(
                COMMUNITY_TEMPLATES.publishFormPage.authorDetails
                  .nameRequiredError,
              )
        }
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
        data-testid="t--community-template-author-email-input"
        defaultValue={authorEmail}
        errorMessage={
          !isEmailValid ? createMessage(FORM_VALIDATION_INVALID_EMAIL) : ""
        }
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
        type="email"
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
