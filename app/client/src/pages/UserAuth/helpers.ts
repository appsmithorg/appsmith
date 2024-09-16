import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { SubmissionError } from "redux-form";
import { useCallback, useEffect, useState } from "react";
import * as Sentry from "@sentry/react";
import UserApi from "ee/api/UserApi";
import { toast } from "@appsmith/ads";
import type { ApiResponse } from "../../api/ApiResponses";

export interface LoginFormValues {
  username?: string;
  password?: string;
  remember?: string;
}

export interface SignupFormValues {
  email?: string;
  password?: string;
  name?: string;
}

export interface ResetPasswordFormValues {
  password?: string;
  token?: string;
  email?: string;
}

export type CreatePasswordFormValues = ResetPasswordFormValues;

export interface ForgotPasswordFormValues {
  email?: string;
}

export const signupFormSubmitHandler = async (
  values: SignupFormValues,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  const { email, password } = values;
  return new Promise((resolve, reject) => {
    dispatch({
      type: ReduxActionTypes.CREATE_USER_INIT,
      payload: {
        resolve,
        reject,
        email,
        password,
      },
    });
  }).catch((error) => {
    throw new SubmissionError(error);
  });
};

export const resetPasswordSubmitHandler = async (
  values: ResetPasswordFormValues,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  const { email, password, token } = values;
  return new Promise((resolve, reject) => {
    dispatch({
      type: ReduxActionTypes.RESET_USER_PASSWORD_INIT,
      payload: {
        resolve,
        reject,
        token,
        email,
        password,
      },
    });
  }).catch((error) => {
    throw new SubmissionError(error);
  });
};

export const createPasswordSubmitHandler = async (
  values: CreatePasswordFormValues,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  const { email, password, token } = values;
  return new Promise((resolve, reject) => {
    dispatch({
      type: ReduxActionTypes.INVITED_USER_SIGNUP_INIT,
      payload: {
        resolve,
        reject,
        token,
        email,
        password,
      },
    });
  }).catch((error) => {
    throw new SubmissionError(error);
  });
};

export const forgotPasswordSubmitHandler = async (
  values: ForgotPasswordFormValues,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  const { email } = values;
  return new Promise((resolve, reject) => {
    dispatch({
      type: ReduxActionTypes.FORGOT_PASSWORD_INIT,
      payload: {
        resolve,
        reject,
        email,
      },
    });
  }).catch((error) => {
    error.email = "";
    throw new SubmissionError(error);
  });
};

export const useResendEmailVerification = (
  email: string | null,
): [() => void, boolean, number] => {
  const [clicks, setClicks] = useState(0);
  const [linkEnabled, setLinkEnabled] = useState(true);

  // Disable the link for 30 seconds when clicked
  useEffect(() => {
    if (linkEnabled === false) {
      setTimeout(() => {
        setLinkEnabled(true);
      }, 30000);
    }
  }, [linkEnabled]);

  const resendVerificationLink = useCallback(() => {
    // Track clicks
    setClicks(clicks + 1);
    setLinkEnabled(false);
    if (!email) {
      const errorMessage = "Email not found for retry verification";
      Sentry.captureMessage(errorMessage);
      toast.show(errorMessage, { kind: "error" });
      return;
    }
    UserApi.resendEmailVerification(email)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .then((response: ApiResponse) => {
        if (!response.responseMeta.success && response.responseMeta.error) {
          const { code, message } = response.responseMeta.error;
          const errorMessage = `${code}: ${message}`;
          toast.show(errorMessage, { kind: "error" });
          return;
        }
        toast.show("Verification email sent!", { kind: "success" });
      })
      .catch((error) => {
        toast.show(error.message, { kind: "error" });
      });
  }, [email, clicks]);
  return [resendVerificationLink, linkEnabled, clicks];
};
