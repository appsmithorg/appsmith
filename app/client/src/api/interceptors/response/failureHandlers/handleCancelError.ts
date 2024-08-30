import axios from "axios";
import type { AxiosError } from "axios";
import { UserCancelledActionExecutionError } from "sagas/ActionExecution/errorUtils";

export async function handleCancelError(error: AxiosError) {
  if (axios.isCancel(error)) {
    throw new UserCancelledActionExecutionError();
  }

  return null;
}
