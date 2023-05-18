import type { TypeOptions } from "react-toastify";
import { promisify } from "./utils/Promisify";

function showAlertFnDescriptor(message: string, style: TypeOptions) {
  return {
    type: "SHOW_ALERT" as const,
    payload: { message, style },
  };
}

export type TShowAlertArgs = Parameters<typeof showAlertFnDescriptor>;
export type TShowAlertDescription = ReturnType<typeof showAlertFnDescriptor>;
export type TShowAlertActionType = TShowAlertDescription["type"];

async function showAlert(...args: Parameters<typeof showAlertFnDescriptor>) {
  return promisify(showAlertFnDescriptor)(...args);
}

export default showAlert;
