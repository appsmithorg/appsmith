import { submitCurlImportForm } from "actions/importActions";

export type curlImportFormValues = {
  curl: string;
  pageId: string;
  name: string;
};

export const curlImportSubmitHandler = (
  values: curlImportFormValues,
  dispatch: any,
) => {
  dispatch(submitCurlImportForm(values));
};
