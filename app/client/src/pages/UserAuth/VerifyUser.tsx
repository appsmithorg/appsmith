import React, { useEffect } from "react";
import Container from "./Container";
import type { RouteComponentProps } from "react-router-dom";
import { Spinner } from "design-system";
import * as Sentry from "@sentry/react";
import { EMAIL_VERIFICATION_PATH } from "@appsmith/constants/ApiConstants";
import { Redirect } from "react-router-dom";
import { VerificationErrorType } from "./VerificationError";

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

  useEffect(() => {
    if (!token || !email || !redirectUrl) {
      Sentry.captureMessage("User Email Verification link is damaged");
    }
    const formElement: HTMLFormElement = document.getElementById(
      "verification-form",
    ) as HTMLFormElement;

    formElement && formElement.submit();
  }, [token, email]);

  const submitUrl = new URL(
    `/api/v1/` + EMAIL_VERIFICATION_PATH,
    window.location.origin,
  ).toString();

  if (!token || !email || !redirectUrl) {
    return (
      <Redirect
        to={`/user/verify-error?code=${VerificationErrorType.MISMATCH}`}
      />
    );
  }

  return (
    <Container title={"Verifying"}>
      <form action={submitUrl} id="verification-form" method="POST">
        <input name="token" type="hidden" value={token} />
        <input name="email" type="hidden" value={email} />
        <input name="redirectUrl" type="hidden" value={redirectUrl} />
      </form>
      <Spinner size="lg" />
    </Container>
  );
};

export default VerifyUser;
