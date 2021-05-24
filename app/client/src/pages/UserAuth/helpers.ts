import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { SubmissionError } from "redux-form";

export type LoginFormValues = {
  username?: string;
  password?: string;
  remember?: string;
};

export type SignupFormValues = {
  email?: string;
  password?: string;
  name?: string;
};

export type ResetPasswordFormValues = {
  password?: string;
  token?: string;
  email?: string;
};

export type CreatePasswordFormValues = ResetPasswordFormValues;

export type ForgotPasswordFormValues = {
  email?: string;
};

export const signupFormSubmitHandler = (
  values: SignupFormValues,
  dispatch: any,
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

export const resetPasswordSubmitHandler = (
  values: ResetPasswordFormValues,
  dispatch: any,
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

export const createPasswordSubmitHandler = (
  values: CreatePasswordFormValues,
  dispatch: any,
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

export const forgotPasswordSubmitHandler = (
  values: ForgotPasswordFormValues,
  dispatch: any,
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
