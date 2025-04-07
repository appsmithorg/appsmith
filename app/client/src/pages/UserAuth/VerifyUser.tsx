import React, { useEffect } from "react";
import Container from "./Container";
import type { RouteComponentProps } from "react-router-dom";
import { Spinner } from "@appsmith/ads";
import * as Sentry from "@sentry/react";
import { EMAIL_VERIFICATION_PATH } from "ee/constants/ApiConstants";
import { Redirect } from "react-router-dom";
import { VerificationErrorType } from "./VerificationError";
import CsrfTokenInput from "pages/UserAuth/CsrfTokenInput";

const VerifyUser = (
  props: RouteComponentProps<{
    email: string;
    token: string;
    redirectUrl: string;
    organizationId: string;
  }>,
) => {
  const queryParams = new URLSearchParams(props.location.search);

  const token = queryParams.get("token");
  const email = queryParams.get("email");
  const organizationId = queryParams.get("organizationId");

  useEffect(() => {
    if (!token || !email) {
      Sentry.captureMessage("User email verification link is damaged");
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

  if (!token || !email) {
    return (
      <Redirect
        to={`/user/verify-error?code=${VerificationErrorType.MISMATCH}`}
      />
    );
  }

  return (
    <Container title={"Verifying"}>
      <form action={submitUrl} id="verification-form" method="POST">
        <CsrfTokenInput />
        <input name="email" type="hidden" value={email} />
        <input name="token" type="hidden" value={token} />
        {organizationId && (
          <input name="organizationId" type="hidden" value={organizationId} />
        )}
        {queryParams.get("redirectUrl") && (
          <input
            name="redirectUrl"
            type="hidden"
            value={queryParams.get("redirectUrl") || ""}
          />
        )}
        {queryParams.get("enableFirstTimeUserExperience") && (
          <input
            name="enableFirstTimeUserExperience"
            type="hidden"
            value={queryParams.get("enableFirstTimeUserExperience") || "false"}
          />
        )}
      </form>
      <Spinner size="lg" />
    </Container>
  );
};

export default VerifyUser;
