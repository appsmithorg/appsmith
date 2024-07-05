import { submitCurlImportForm } from "actions/importActions";
import type { ActionParentEntityTypeInterface } from "@appsmith/entities/Engine/actionHelpers";

export interface curlImportFormValues {
  curl: string;
  contextId: string;
  name: string;
  contextType: ActionParentEntityTypeInterface;
}

export const curlImportSubmitHandler = (
  values: curlImportFormValues,
  dispatch: any,
) => {
  dispatch(submitCurlImportForm(values));
};
