import React, { useEffect } from "react";
import Container from "./Container";
import { Button, Callout, Link, Text } from "design-system";
import { AUTH_LOGIN_URL } from "constants/routes";
import {
  createMessage,
  DEFAULT_ERROR_MESSAGE,
  FORGOT_PASSWORD_PAGE_LOGIN_LINK,
  PAGE_CLIENT_ERROR_DESCRIPTION,
  VERIFY_ERROR_ALREADY_VERIFIED_TITLE,
  VERIFY_ERROR_EXPIRED_TITLE,
  VERIFY_ERROR_MISMATCH_TITLE,
} from "@appsmith/constants/messages";
import { useResendEmailVerification } from "./helpers";
import type { RouteComponentProps } from "react-router-dom";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";

const Body = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export enum VerificationErrorType {
  MISSING_PARAMETER = "AE-APP-4000",
  ALREADY_VERIFIED = "AE-EMV-4095",
  EXPIRED = "AE-EMV-4096",
  MISMATCH = "AE-EMV-4098",
  UNKNOWN = "UNKNOWN",
}

const VerificationError = (
  props: RouteComponentProps<{
    errorCode: string;
    email: string;
    message: string;
  }>,
) => {
  const queryParams = new URLSearchParams(props.location.search);
  const email = queryParams.get("email");
  const code = queryParams.get("code");
  const message = queryParams.get("message");
  const [resendVerificationLink, enabled] = useResendEmailVerification(email);
  useEffect(() => {
    AnalyticsUtil.logEvent("EMAIL_VERIFICATION_FAILED", {
      errorCode: code,
      message,
    });
  }, [code, message]);

  if (code === VerificationErrorType.EXPIRED) {
    return (
      <Container testId="verification-error" title="">
        <Body>
          <Callout kind="error">
            <Text kind={"body-m"}>
              {createMessage(VERIFY_ERROR_EXPIRED_TITLE)}
            </Text>
          </Callout>
        </Body>
        <Body>
          <Button
            isDisabled={!enabled}
            onClick={resendVerificationLink}
            size="md"
          >
            Send new link
          </Button>
        </Body>
      </Container>
    );
  }

  if (code === VerificationErrorType.MISSING_PARAMETER) {
    return (
      <Container testId="verification-error" title="">
        <Body>
          <Callout kind="error">
            <Text kind={"body-m"}>{message}</Text>
          </Callout>
        </Body>
        <Body>
          <Button
            isDisabled={!enabled}
            onClick={resendVerificationLink}
            size="md"
          >
            Send new link
          </Button>
        </Body>
      </Container>
    );
  }

  if (code === VerificationErrorType.ALREADY_VERIFIED) {
    return (
      <Container
        footer={
          <div className="px-2 py-4 flex align-center justify-center text-base text-center text-[color:var(--ads-v2\-color-fg)] text-[14px]">
            <Link
              className="pl-[var(--ads-v2\-spaces-3)]"
              kind="primary"
              target="_self"
              to={AUTH_LOGIN_URL}
            >
              {createMessage(FORGOT_PASSWORD_PAGE_LOGIN_LINK)}
            </Link>
          </div>
        }
        testId="verification-error"
        title=""
      >
        <Body>
          <Callout kind="error">
            <Text kind={"body-m"}>
              {createMessage(VERIFY_ERROR_ALREADY_VERIFIED_TITLE)}
            </Text>
          </Callout>
        </Body>
      </Container>
    );
  }

  if (code === VerificationErrorType.MISMATCH) {
    return (
      <Container testId="verification-error" title="">
        <Body>
          <Callout kind="error">
            <Text kind={"body-m"}>
              {createMessage(VERIFY_ERROR_MISMATCH_TITLE)}
            </Text>
          </Callout>
        </Body>
        <Body>
          <Button
            isDisabled={!enabled}
            onClick={resendVerificationLink}
            size="md"
          >
            Send new link
          </Button>
        </Body>
      </Container>
    );
  }

  return (
    <Container
      testId="verification-error"
      title={createMessage(DEFAULT_ERROR_MESSAGE)}
    >
      <Body>
        <Callout kind="error">
          <Text kind={"body-m"}>
            {createMessage(PAGE_CLIENT_ERROR_DESCRIPTION)}
          </Text>
        </Callout>
      </Body>
    </Container>
  );
};

export default VerificationError;
