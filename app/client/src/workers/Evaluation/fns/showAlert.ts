import { promisify } from "./utils/Promisify";

function showAlertFnDescriptor(
  message: string,
  style: "info" | "success" | "warning" | "error" | "default",
) {
  return {
    type: "SHOW_ALERT",
    payload: { message, style },
  };
}
const showAlert = promisify(showAlertFnDescriptor);

export default showAlert;
