import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const updateQueryParams = (id: string, form: any) => {
  return {
    type: ReduxActionTypes.UPDATE_QUERY_PARAMS,
    payload: {
      id,
      form,
    },
  };
};
