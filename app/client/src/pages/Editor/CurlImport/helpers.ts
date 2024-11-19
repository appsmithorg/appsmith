import { submitCurlImportForm } from "../../../actions/importActions";
import type { ActionParentEntityTypeInterface } from "ee/entities/Engine/actionHelpers";

export interface CurlImportFormValues {
  curl: string;
  contextId: string;
  name: string;
  contextType: ActionParentEntityTypeInterface;
}

export const curlImportSubmitHandler = (
  values: CurlImportFormValues,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
) => {
  dispatch(submitCurlImportForm(values));
};
