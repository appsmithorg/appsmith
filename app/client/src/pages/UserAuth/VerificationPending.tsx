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
import { Link, Text } from "design-system";
import styled from "styled-components";
import { AUTH_LOGIN_URL } from "constants/routes";
import { useResendEmailVerification } from "./helpers";

const Body = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const Email = styled(Text)`
  font-weight: var(--ads-v2-font-weight-bold);
`;

const VerificationPending = (props: RouteComponentProps<{ email: string }>) => {
  const queryParams = new URLSearchParams(props.location.search);
  const email = queryParams.get("email");

  const resendVerificationLink = useResendEmailVerification(email);

  return (
    <Container title={createMessage(VERIFICATION_PENDING_TITLE)}>
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
        <Link kind="primary" onClick={resendVerificationLink}>
          {createMessage(VERIFICATION_PENDING_RESEND_LINK)}
        </Link>
      </Body>
    </Container>
  );
};

export default VerificationPending;
