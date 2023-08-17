import React, { useEffect, useState } from "react";
import Container from "./Container";
import {
  createMessage,
  DEFAULT_ERROR_MESSAGE,
  FORGOT_PASSWORD_PAGE_LOGIN_LINK,
  PAGE_CLIENT_ERROR_DESCRIPTION,
  VERIFY_ERROR_ALREADY_VERIFIED_TITLE,
  VERIFY_ERROR_EXPIRED_TITLE,
  VERIFY_ERROR_MISMATCH_TITLE,
} from "@appsmith/constants/messages";
import type { RouteComponentProps } from "react-router-dom";
import { Button, Callout, Link, Spinner, Text } from "design-system";
import styled from "styled-components";
import { AUTH_LOGIN_URL } from "constants/routes";
import * as Sentry from "@sentry/react";
import { useResendEmailVerification } from "./helpers";
// import AnalyticsUtil from "../../utils/AnalyticsUtil";
import { EMAIL_VERIFICATION_PATH } from "@appsmith/constants/ApiConstants";

const Body = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

enum ErrorType {
  ALREADY_VERIFIED = "AE-EMV-4095",
  EXPIRED = "AE-EMV-4096",
  MISMATCH = "AE-EMV-4098",
  UNKNOWN = "UNKNOWN",
}

const VerifyUser = (
  props: RouteComponentProps<{
    email: string;
    token: string;
    redirectUrl: string;
  }>,
) => {
  const queryParams = new URLSearchParams(props.location.search);
  const token = queryParams.get("token");
  const email = queryParams.get("email");
  const redirectUrl = queryParams.get("redirectUrl");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorType>(ErrorType.UNKNOWN);

  useEffect(() => {
    if (!token || !email || !redirectUrl) {
      Sentry.captureMessage("User Email Verification link is damaged");
      setLoading(false);
      setError(ErrorType.UNKNOWN);
      return;
    }
    const formElement: HTMLFormElement = document.getElementById(
      "verification-form",
    ) as HTMLFormElement;

    formElement && formElement.submit();

    // UserApi.verifyUser(token, email, redirectUrl)
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-ignore
    //   .then((response: ApiResponse) => {
    //     if (!response.responseMeta.success) {
    //       const errorCode =
    //         (response.responseMeta.error?.code as ErrorType) ||
    //         ErrorType.UNKNOWN;
    //       setLoading(false);
    //       setError(errorCode);
    //       AnalyticsUtil.logEvent("EMAIL_VERIFICATION_FAILED", {
    //         response: response.responseMeta,
    //       });
    //       return;
    //     }
    //
    //     toast.show("Email verified successfully", { kind: "success" });
    //   })
    //   .catch(() => {
    //     setLoading(false);
    //     setError(ErrorType.UNKNOWN);
    //   });
  }, [token, email]);

  const [resendVerificationLink, enabled] = useResendEmailVerification(email);

  const submitUrl = new URL(
    `/api/v1/` + EMAIL_VERIFICATION_PATH,
    window.location.origin,
  ).toString();

  if (loading && token && email && redirectUrl) {
    return (
      <Container title={"Verifying"}>
        <form action={submitUrl} id="verification-form" method="POST">
          <input name="token" type="hidden" value={token} />
          <input name="email" type="hidden" value={email} />
          <input name="redirectUrl" type="hidden" value={redirectUrl} />
        </form>
        {loading && <Spinner size="lg" />}
      </Container>
    );
  }

  if (error === ErrorType.EXPIRED) {
    return (
      <Container title="">
        <Body>
          <Callout kind="error">
            <Text kind={"body-m"}>
              {createMessage(VERIFY_ERROR_EXPIRED_TITLE)}
            </Text>
          </Callout>
        </Body>
        <Body>
          <Button isDisabled={!enabled} onClick={resendVerificationLink}>
            Send new link
          </Button>
        </Body>
      </Container>
    );
  }

  if (error === ErrorType.ALREADY_VERIFIED) {
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

  if (error === ErrorType.MISMATCH) {
    return (
      <Container title="">
        <Body>
          <Callout kind="error">
            <Text kind={"body-m"}>
              {createMessage(VERIFY_ERROR_MISMATCH_TITLE)}
            </Text>
          </Callout>
        </Body>
        <Body>
          <Button isDisabled={!enabled} onClick={resendVerificationLink}>
            Send new link
          </Button>
        </Body>
      </Container>
    );
  }

  return (
    <Container title={createMessage(DEFAULT_ERROR_MESSAGE)}>
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

export default VerifyUser;
