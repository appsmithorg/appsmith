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

export const sortedDatasourcesHandler = (
  datasources: Record<string, any>,
  currentDatasourceId: string,
) => {
  // this function sorts the datasources list, with the current action's datasource first, followed by others.
  let sortedArr = [];

  sortedArr = datasources.filter(
    (d: { id: string }) => d?.id === currentDatasourceId,
  );

  sortedArr = [
    ...sortedArr,
    ...datasources.filter((d: { id: string }) => d?.id !== currentDatasourceId),
  ];

  return sortedArr;
};
