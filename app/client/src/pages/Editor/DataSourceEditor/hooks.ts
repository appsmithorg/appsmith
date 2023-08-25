import { executeDatasourceQuery } from "actions/datasourceActions";
import type { QueryTemplate } from "entities/Datasource";
import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";

type FetchPreviewData = {
  datasourceId: string;
  template: QueryTemplate;
};

type UseDatasourceQueryReturn = {
  fetchPreviewData: (data: FetchPreviewData) => void;
  isLoading: boolean;
  failedFetchingPreviewData: boolean;
};

type UseDatasourceQueryParams = {
  setPreviewData: (data: any) => void;
  setPreviewDataError: (string: any) => void;
};

export const useDatasourceQuery = ({
  setPreviewData,
  setPreviewDataError,
}: UseDatasourceQueryParams): UseDatasourceQueryReturn => {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [failedFetchingPreviewData, setFailedFetchingPreviewData] =
    useState(false);

  const onFetchPreviewDataSuccess = useCallback((payload: any) => {
    setIsLoading(false);

    if (payload.data && payload.data.body) {
      if (Array.isArray(payload.data?.body)) {
        setPreviewData(payload.data?.body);
      } else {
        // if the response from the server is anything but an array of data, set the error flag
        setFailedFetchingPreviewData(true);
      }
    }
  }, []);

  const onFetchPreviewDataFailure = useCallback(() => {
    setIsLoading(false);
    setFailedFetchingPreviewData(true);
  }, []);

  const fetchPreviewData = useCallback(
    (data: FetchPreviewData) => {
      setIsLoading(true);
      setFailedFetchingPreviewData(false);

      // reset states
      setPreviewDataError(false);
      setPreviewData([]);

      dispatch(
        executeDatasourceQuery({
          payload: {
            ...data,
            isGeneratePage: false,
          },
          onSuccessCallback: onFetchPreviewDataSuccess,
          onErrorCallback: onFetchPreviewDataFailure,
        }),
      );
    },
    [isLoading],
  );

  return {
    fetchPreviewData,
    isLoading,
    failedFetchingPreviewData,
  };
};
