import { promisify } from "./utils/Promisify";

function logoutFnDescriptor(redirectURL: string) {
  return {
    type: "LOGOUT_USER_INIT" as const,
    payload: {
      redirectURL,
    },
  };
}

export type TSLogoutActionType = ReturnType<typeof logoutFnDescriptor>;

export async function logoutUser(
  ...args: Parameters<typeof logoutFnDescriptor>
) {
  return promisify(logoutFnDescriptor)(...args);
}
