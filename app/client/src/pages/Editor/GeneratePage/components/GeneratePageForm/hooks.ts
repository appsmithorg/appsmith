import { useEffect, useState, useCallback } from "react";
import { DropdownOptions } from "../constants";
import { Datasource } from "entities/Datasource";
import { GenerateCRUDEnabledPluginMap } from "api/PluginApi";
import { CONNECT_NEW_DATASOURCE_OPTION_ID } from "../DataSourceOption";
import { useDispatch } from "react-redux";
import { executeDatasourceQuery } from "actions/datasourceActions";
import { ResponseMeta } from "api/ApiResponses";
import { DropdownOption } from "components/ads/Dropdown";

export const FAKE_DATASOURCE_OPTION = {
  CONNECT_NEW_DATASOURCE_OPTION: {
    id: CONNECT_NEW_DATASOURCE_OPTION_ID,
    label: "Connect New Datasource",
    value: "Connect New Datasource",
    data: {
      pluginId: "",
    },
  },
};

export const useDatasourceOptions = ({
  datasources,
  generateCRUDSupportedPlugin,
}: {
  datasources: Datasource[];
  generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap;
}) => {
  const [dataSourceOptions, setDataSourceOptions] = useState<DropdownOptions>(
    [],
  );

  useEffect(() => {
    // On mount of component and on change of datasources, Update the list.
    const unSupportedDatasourceOptions: DropdownOptions = [];
    const supportedDatasourceOptions: DropdownOptions = [];
    let newDataSourceOptions: DropdownOptions = [];
    newDataSourceOptions.push(
      FAKE_DATASOURCE_OPTION.CONNECT_NEW_DATASOURCE_OPTION,
    );
    datasources.forEach(({ id, isValid, name, pluginId }) => {
      const datasourceObject = {
        id,
        label: name,
        value: name,
        data: {
          pluginId,
          isSupportedForTemplate: !!generateCRUDSupportedPlugin[pluginId],
          isValid,
        },
      };
      if (generateCRUDSupportedPlugin[pluginId])
        supportedDatasourceOptions.push(datasourceObject);
      else {
        unSupportedDatasourceOptions.push(datasourceObject);
      }
    });
    newDataSourceOptions = newDataSourceOptions.concat(
      supportedDatasourceOptions,
      unSupportedDatasourceOptions,
    );
    setDataSourceOptions(newDataSourceOptions);
  }, [datasources, setDataSourceOptions, generateCRUDSupportedPlugin]);
  return dataSourceOptions;
};

const payload = [
  {
    value: "LIST_BUCKETS",
  },
];

export type executeDatasourceQuerySuccessPayload = {
  responseMeta: ResponseMeta;
  data: {
    body: { bucketList: string[] };
    headers: Record<string, string[]>;
    statusCode: string;
    isExecutionSuccess: boolean;
  };
};

export const useS3BucketList = () => {
  const dispatch = useDispatch();

  const [bucketList, setBucketList] = useState<Array<string>>([]);
  const [isFetchingBucketList, setIsFetchingBucketList] = useState<boolean>(
    false,
  );
  const [failedFetchingBucketList, setFailedFetchingBucketList] = useState<
    boolean
  >(false);
  const onFetchBucketSuccess = useCallback(
    (payload: executeDatasourceQuerySuccessPayload) => {
      setIsFetchingBucketList(false);
      if (payload.data && payload.data.body) {
        const payloadBody = payload.data.body;
        const { bucketList: list = [] } = payloadBody;
        setBucketList(list);
      }
    },
    [setBucketList, setIsFetchingBucketList],
  );

  const onFetchBucketFailure = useCallback(() => {
    setIsFetchingBucketList(false);
    setFailedFetchingBucketList(true);
  }, [setIsFetchingBucketList]);

  const fetchBucketList = useCallback(
    ({ selectedDatasource }: { selectedDatasource: DropdownOption }) => {
      if (selectedDatasource.id) {
        setIsFetchingBucketList(true);
        setFailedFetchingBucketList(false);
        dispatch(
          executeDatasourceQuery({
            payload: {
              datasourceId: selectedDatasource.id,
              data: payload,
            },
            onSuccessCallback: onFetchBucketSuccess,
            onErrorCallback: onFetchBucketFailure,
          }),
        );
      }
    },
    [onFetchBucketSuccess, onFetchBucketFailure, setIsFetchingBucketList],
  );

  return {
    bucketList,
    isFetchingBucketList,
    failedFetchingBucketList,
    fetchBucketList,
  };
};
