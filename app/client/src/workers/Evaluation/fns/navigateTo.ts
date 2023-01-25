import { NavigationTargetType } from "sagas/ActionExecution/NavigateActionSaga";
import { promisify } from "./utils/Promisify";

function navigateToFnDescriptor(
  pageNameOrUrl: string,
  params: Record<string, string>,
  target?: NavigationTargetType,
) {
  return {
    type: "NAVIGATE_TO",
    payload: { pageNameOrUrl, params, target },
  };
}
const navigateTo = promisify(navigateToFnDescriptor);

export default navigateTo;
