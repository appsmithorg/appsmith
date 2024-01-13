import React from "react";
import Container from "./Container";
import {
  createMessage,
  VERIFICATION_PENDING_BODY,
  VERIFICATION_PENDING_NO_EMAIL,
  VERIFICATION_PENDING_NOT_YOU,
  VERIFICATION_PENDING_RESEND_LINK,
  VERIFICATION_PENDING_TITLE,
} from "@appsmith/constants/messages";
import type { RouteComponentProps } from "react-router-dom";
import { Button, Callout, Link, Text } from "design-system";
import styled from "styled-components";
import { AUTH_LOGIN_URL } from "constants/routes";
import { useResendEmailVerification } from "./helpers";

const Body = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;
const Email = styled(Text)`
  font-weight: var(--ads-v2-font-weight-bold);
`;

const VerificationPending = (props: RouteComponentProps<{ email: string }>) => {
  const queryParams = new URLSearchParams(props.location.search);
  const email = queryParams.get("email");

  const [resendVerificationLink, enabled, clicks] =
    useResendEmailVerification(email);

  return (
    <Container
      testId="verification-pending"
      title={createMessage(VERIFICATION_PENDING_TITLE)}
    >
      <Body>
        <Text kind={"body-m"}>
          {createMessage(VERIFICATION_PENDING_BODY)} <Email>{email}</Email>
        </Text>
        <Link kind="primary" to={AUTH_LOGIN_URL}>
          {createMessage(VERIFICATION_PENDING_NOT_YOU)}
        </Link>
      </Body>
      <Body>
        <Text kind="body-m">
          {createMessage(VERIFICATION_PENDING_NO_EMAIL)}
        </Text>
      </Body>
      <Button
        isDisabled={!enabled}
        kind="primary"
        onClick={resendVerificationLink}
        size="md"
      >
        {createMessage(VERIFICATION_PENDING_RESEND_LINK)}
      </Button>
      {clicks > 1 ? (
        <Callout kind="warning">
          Still having trouble with the email? Reach out to the instance admin,
          and they can help you get started
        </Callout>
      ) : null}
    </Container>
  );
};

export default VerificationPending;
