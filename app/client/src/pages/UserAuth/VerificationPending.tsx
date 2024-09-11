import React from "react";
import Container from "./Container";
import {
  createMessage,
  VERIFICATION_PENDING_NO_EMAIL,
  VERIFICATION_PENDING_NOT_YOU,
  VERIFICATION_PENDING_RESEND_LINK,
  VERIFICATION_PENDING_TITLE,
} from "ee/constants/messages";
import type { RouteComponentProps } from "react-router-dom";
import { Button, Callout, Link, Text } from "@appsmith/ads";
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
      footer={
        <div className="px-2 flex align-center justify-center text-center text-[color:var(--ads-v2\-color-fg)] text-[14px]">
          <Link kind="primary" target="_self" to={AUTH_LOGIN_URL}>
            {createMessage(VERIFICATION_PENDING_NOT_YOU)}
          </Link>
        </div>
      }
      testId="verification-pending"
      title={createMessage(VERIFICATION_PENDING_TITLE)}
    >
      <Body>
        <Text kind={"body-m"}>
          Click the verification link sent to <Email>{email}</Email> to finish
          setting up your account.
        </Text>
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
