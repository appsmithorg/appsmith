import { useEffect, useState, useCallback } from "react";
import type { DropdownOptions } from "../constants";
import type { Datasource } from "entities/Datasource";
import type { GenerateCRUDEnabledPluginMap } from "api/PluginApi";
import { CONNECT_NEW_DATASOURCE_OPTION_ID } from "../DataSourceOption";
import type { executeDatasourceQuerySuccessPayload } from "actions/datasourceActions";
import { executeDatasourceQuery } from "actions/datasourceActions";
import type { DropdownOption } from "design-system-old";
import { useDispatch, useSelector } from "react-redux";
import { PluginPackageName } from "entities/Action";
import { getCurrentEnvironmentId } from "@appsmith/selectors/environmentSelectors";

export const FAKE_DATASOURCE_OPTION = {
  CONNECT_NEW_DATASOURCE_OPTION: {
    id: CONNECT_NEW_DATASOURCE_OPTION_ID,
    label: "Connect new datasource",
    value: CONNECT_NEW_DATASOURCE_OPTION_ID,
    data: {
      pluginId: "",
    },
  },
};

export const useDatasourceOptions = ({
  canCreateDatasource,
  datasources,
  fetchingDatasourceConfigs,
  generateCRUDSupportedPlugin,
}: {
  canCreateDatasource: boolean;
  datasources: Datasource[];
  fetchingDatasourceConfigs: boolean;
  generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap;
}) => {
  const [dataSourceOptions, setDataSourceOptions] = useState<DropdownOptions>(
    [],
  );
  const currentEnvironment = useSelector(getCurrentEnvironmentId);

  useEffect(() => {
    // On mount of component and on change of datasources, Update the list.
    const unSupportedDatasourceOptions: DropdownOptions = [];
    const supportedDatasourceOptions: DropdownOptions = [];
    let newDataSourceOptions: DropdownOptions = [];
    if (canCreateDatasource) {
      newDataSourceOptions.push(
        FAKE_DATASOURCE_OPTION.CONNECT_NEW_DATASOURCE_OPTION,
      );
    }
    datasources.forEach(({ datasourceStorages, id, name, pluginId }) => {
      // Doing this since g sheets plugin is not supported for environments
      // and we need to show the option in the dropdown
      const isGoogleSheetPlugin =
        generateCRUDSupportedPlugin.hasOwnProperty(pluginId) &&
        generateCRUDSupportedPlugin[pluginId] ===
          PluginPackageName.GOOGLE_SHEETS;
      const datasourceStorage = isGoogleSheetPlugin
        ? Object.values(datasourceStorages)[0]
        : datasourceStorages[currentEnvironment];
      const datasourceObject = {
        id,
        label: name,
        value: name,
        data: {
          pluginId,
          isSupportedForTemplate: !!generateCRUDSupportedPlugin[pluginId],
          isValid: datasourceStorage?.isValid,
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
  }, [
    datasources,
    setDataSourceOptions,
    generateCRUDSupportedPlugin,
    fetchingDatasourceConfigs,
  ]);
  return dataSourceOptions;
};

// const GOOGLE_SHEET_METHODS = {
//   GET_ALL_SPREADSHEETS: "LIST", // Get all the spreadsheets
//   GET_ALL_SHEETS: "INFO", // fetch all the sub-sheets
//   GET_ALL_COLUMNS: "GET_STRUCTURE", // Get column names
// };

// const demoRequest: Record<any, string> = {
//   method: "",
//   sheetUrl: "",
//   range: "",
//   spreadsheetName: "",
//   tableHeaderIndex: "1",
//   queryFormat: "ROWS",
//   rowLimit: "",
//   sheetName: "",
//   rowOffset: "",
//   rowObject: "",
//   rowObjects: "",
//   rowIndex: "",
//   deleteFormat: "SHEET",
// };

interface FetchAllSpreadSheets {
  selectedDatasourceId: string;
  pluginId: string;
  requestObject?: Record<any, string>;
}

export interface UseSpreadSheetsReturn {
  fetchAllSpreadsheets: ({
    requestObject,
    selectedDatasourceId,
  }: FetchAllSpreadSheets) => void;
  isFetchingSpreadsheets: boolean;
  failedFetchingSpreadsheets: boolean;
}

export const useSpreadSheets = ({
  setSelectedDatasourceIsInvalid,
  setSelectedDatasourceTableOptions,
}: {
  setSelectedDatasourceIsInvalid: (isInvalid: boolean) => void;
  setSelectedDatasourceTableOptions: (tableOptions: DropdownOptions) => void;
}): UseSpreadSheetsReturn => {
  const dispatch = useDispatch();

  // const [spreadsheetsList, setSpreadsheets] = useState<DropdownOption[]>([]);

  const [isFetchingSpreadsheets, setIsFetchingSpreadsheets] =
    useState<boolean>(false);
  const [failedFetchingSpreadsheets, setFailedFetchingSpreadsheets] =
    useState<boolean>(false);

  // TODO :- Create loading state and set Loading state false on success or error
  const onFetchAllSpreadsheetFailure = useCallback(() => {
    setIsFetchingSpreadsheets(false);
    setFailedFetchingSpreadsheets(true);
  }, [setIsFetchingSpreadsheets]);

  const onFetchAllSpreadsheetSuccess = useCallback(
    (
      payload: executeDatasourceQuerySuccessPayload<
        Array<{ label: string; value: string }>
      >,
    ) => {
      setIsFetchingSpreadsheets(false);
      if (payload.data && payload.data.trigger) {
        const spreadSheets = payload.data.trigger;

        if (Array.isArray(spreadSheets)) {
          setSelectedDatasourceTableOptions(spreadSheets);
        } else {
          // to handle error like "401 Unauthorized"
          setSelectedDatasourceIsInvalid(true);
        }
      }
    },
    [
      setSelectedDatasourceIsInvalid,
      setSelectedDatasourceTableOptions,
      setIsFetchingSpreadsheets,
    ],
  );

  const fetchAllSpreadsheets = useCallback(
    ({
      pluginId,
      requestObject,
      selectedDatasourceId,
    }: FetchAllSpreadSheets) => {
      setIsFetchingSpreadsheets(true);
      setFailedFetchingSpreadsheets(false);
      const formattedRequestData = {
        datasourceId: selectedDatasourceId,
        displayType: "DROP_DOWN",
        pluginId,
        requestType: "SPREADSHEET_SELECTOR",
        ...requestObject,
      };
      dispatch(
        executeDatasourceQuery({
          payload: {
            datasourceId: selectedDatasourceId,
            data: formattedRequestData,
            isGeneratePage: true,
          },
          onSuccessCallback: onFetchAllSpreadsheetSuccess,
          onErrorCallback: onFetchAllSpreadsheetFailure,
        }),
      );
    },
    [
      onFetchAllSpreadsheetSuccess,
      onFetchAllSpreadsheetFailure,
      setIsFetchingSpreadsheets,
      setFailedFetchingSpreadsheets,
    ],
  );

  return {
    fetchAllSpreadsheets,
    // spreadsheetsList,
    isFetchingSpreadsheets,
    failedFetchingSpreadsheets,
  };
};

// Types

export interface GridProperties {
  rowCount: number;
  columnCount: number;
}

export interface Sheet {
  sheetId: number;
  title: string;
  index: number;
  sheetType: string;
  gridProperties: GridProperties;
}

export type Sheets = Sheet[];

export const getSheetUrl = (sheetId: string): string =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=0`;

export interface FetchSheetsList {
  selectedDatasourceId: string;
  selectedSpreadsheetUrl: string;
  pluginId: string;
  requestObject?: Record<any, string>;
}

export interface FetchSheetData {
  selectedDatasourceId: string;
  selectedSpreadsheetUrl: string;
  selectedSheetName: string;
  pluginId: string;
  requestObject?: Record<any, string>;
}

export interface UseSheetListReturn {
  sheetsList: DropdownOption[];
  isFetchingSheetsList: boolean;
  failedFetchingSheetsList: boolean;
  fetchSheetsList: ({
    requestObject,
    selectedDatasourceId,
    selectedSpreadsheetUrl,
  }: FetchSheetsList) => void;
}

export interface UseSheetDataReturn {
  sheetData: Array<any>;
  isFetchingSheetData: boolean;
  failedFetchingSheetData: boolean;
  fetchSheetData: ({
    requestObject,
    selectedDatasourceId,
    selectedSheetName,
    selectedSpreadsheetUrl,
  }: FetchSheetData) => void;
}

export const useSheetsList = (): UseSheetListReturn => {
  const dispatch = useDispatch();

  const [sheetsList, setSheetsList] = useState<DropdownOption[]>([]);

  const [isFetchingSheetsList, setIsFetchingSheetsList] =
    useState<boolean>(false);
  const [failedFetchingSheetsList, setFailedFetchingSheetsList] =
    useState<boolean>(false);

  const onFetchAllSheetFailure = useCallback(() => {
    setIsFetchingSheetsList(false);
    setFailedFetchingSheetsList(true);
  }, [setIsFetchingSheetsList]);

  const onFetchAllSheetSuccess = useCallback(
    (
      payload: executeDatasourceQuerySuccessPayload<
        Array<{ label: string; value: string }>
      >,
    ) => {
      setIsFetchingSheetsList(false);
      if (payload.data && payload.data.trigger) {
        const responseBody = payload.data.trigger;
        if (Array.isArray(responseBody)) {
          setSheetsList(responseBody);
        } else {
          // to handle error like "401 Unauthorized"
        }
      }
    },
    [setSheetsList, setIsFetchingSheetsList],
  );

  const fetchSheetsList = useCallback(
    ({
      pluginId,
      // requestObject,
      selectedDatasourceId,
      selectedSpreadsheetUrl,
    }: FetchSheetsList) => {
      setSheetsList([]);
      setIsFetchingSheetsList(true);
      setFailedFetchingSheetsList(false);
      const formattedRequestData = {
        datasourceId: selectedDatasourceId,
        displayType: "DROP_DOWN",
        parameters: {
          sheetUrl: selectedSpreadsheetUrl,
        },
        pluginId: pluginId,
        requestType: "SHEET_SELECTOR",
      };
      dispatch(
        executeDatasourceQuery({
          payload: {
            datasourceId: selectedDatasourceId,
            data: formattedRequestData,
            isGeneratePage: true,
          },
          onSuccessCallback: onFetchAllSheetSuccess,
          onErrorCallback: onFetchAllSheetFailure,
        }),
      );
    },
    [
      setSheetsList,
      onFetchAllSheetSuccess,
      onFetchAllSheetFailure,
      setIsFetchingSheetsList,
      setFailedFetchingSheetsList,
    ],
  );

  return {
    sheetsList,
    isFetchingSheetsList,
    failedFetchingSheetsList,
    fetchSheetsList,
  };
};

export const useSheetData = (): UseSheetDataReturn => {
  const dispatch = useDispatch();

  const [sheetData, setSheetData] = useState<any>([]);

  const [isFetchingSheetData, setIsFetchingSheetData] =
    useState<boolean>(false);
  const [failedFetchingSheetData, setFailedFetchingSheetData] =
    useState<boolean>(false);

  const onFetchAllSheetFailure = useCallback(() => {
    setIsFetchingSheetData(false);
    setFailedFetchingSheetData(true);
  }, [setIsFetchingSheetData]);

  const onFetchAllSheetSuccess = useCallback(
    (
      payload: executeDatasourceQuerySuccessPayload<
        Array<{ label: string; value: string }>
      >,
    ) => {
      setIsFetchingSheetData(false);
      if (payload.data && payload.data.trigger) {
        const responseBody = payload.data.trigger;
        if (Array.isArray(responseBody)) {
          setSheetData(responseBody);
        } else {
          // to handle error like "401 Unauthorized"
        }
      }
    },
    [setSheetData, setIsFetchingSheetData],
  );

  const fetchSheetData = useCallback(
    ({
      pluginId,
      selectedDatasourceId,
      selectedSheetName,
      selectedSpreadsheetUrl,
    }: FetchSheetData) => {
      setSheetData([]);
      setIsFetchingSheetData(true);
      setFailedFetchingSheetData(false);
      const formattedRequestData = {
        datasourceId: selectedDatasourceId,
        displayType: "DROP_DOWN",
        parameters: {
          sheetUrl: selectedSpreadsheetUrl,
          sheetName: selectedSheetName,
          queryFormat: "ROWS",
          tableHeaderIndex: 1,
        },
        pluginId: pluginId,
        requestType: "SHEET_DATA",
      };
      dispatch(
        executeDatasourceQuery({
          payload: {
            datasourceId: selectedDatasourceId,
            data: formattedRequestData,
            isGeneratePage: true,
          },
          onSuccessCallback: onFetchAllSheetSuccess,
          onErrorCallback: onFetchAllSheetFailure,
        }),
      );
    },
    [
      setSheetData,
      onFetchAllSheetSuccess,
      onFetchAllSheetFailure,
      setIsFetchingSheetData,
      setFailedFetchingSheetData,
    ],
  );

  return {
    sheetData,
    isFetchingSheetData,
    failedFetchingSheetData,
    fetchSheetData,
  };
};

export interface FetchColumnHeaderListParams {
  selectedDatasourceId: string;
  selectedSpreadsheetUrl: string;
  sheetName: string;
  pluginId: string;
  tableHeaderIndex: string;
  requestObject?: Record<any, string>; //possily unneccesary
}

export interface UseSheetColumnHeadersReturn {
  columnHeaderList: DropdownOption[];
  isFetchingColumnHeaderList: boolean;
  errorFetchingColumnHeaderList: string;
  fetchColumnHeaderList: ({
    selectedDatasourceId,
    selectedSpreadsheetUrl,
    sheetName,
    tableHeaderIndex,
  }: FetchColumnHeaderListParams) => void;
}

export const useSheetColumnHeaders = () => {
  const dispatch = useDispatch();

  const [columnHeaderList, setColumnHeaderList] = useState<DropdownOption[]>(
    [],
  );

  const [isFetchingColumnHeaderList, setIsFetchingColumnHeaderList] =
    useState<boolean>(false);
  const [errorFetchingColumnHeaderList, setErrorFetchingColumnHeaderList] =
    useState<string>("");

  const onFetchColumnHeadersFailure = useCallback(
    (error: string) => {
      setIsFetchingColumnHeaderList(false);
      setErrorFetchingColumnHeaderList(error);
      setColumnHeaderList([]);
    },
    [setErrorFetchingColumnHeaderList, setIsFetchingColumnHeaderList],
  );

  const onFetchColumnHeadersSuccess = useCallback(
    (
      payload: executeDatasourceQuerySuccessPayload<Record<string, string>[]>,
    ) => {
      setIsFetchingColumnHeaderList(false);

      if (payload.data && payload.data.trigger) {
        const responseBody = payload.data.trigger;
        if (Array.isArray(responseBody)) {
          setColumnHeaderList(responseBody);
        } else {
          let error = "Failed fetching Column headers";
          if (typeof responseBody === "string") {
            error = responseBody;
          }
          setColumnHeaderList([]);
          setErrorFetchingColumnHeaderList(error);
        }
      }
    },
    [
      setColumnHeaderList,
      setIsFetchingColumnHeaderList,
      setErrorFetchingColumnHeaderList,
    ],
  );

  const fetchColumnHeaderList = useCallback(
    (params: FetchColumnHeaderListParams) => {
      setIsFetchingColumnHeaderList(true);
      setErrorFetchingColumnHeaderList("");
      const formattedRequestData = {
        datasourceId: params.selectedDatasourceId,
        displayType: "DROP_DOWN",
        parameters: {
          sheetName: params.sheetName,
          sheetUrl: params.selectedSpreadsheetUrl,
          tableHeaderIndex: params.tableHeaderIndex,
        },
        pluginId: params.pluginId,
        requestType: "COLUMNS_SELECTOR",
      };

      dispatch(
        executeDatasourceQuery({
          payload: {
            datasourceId: params.selectedDatasourceId,
            data: formattedRequestData,
            isGeneratePage: true,
          },
          onSuccessCallback: onFetchColumnHeadersSuccess,
          onErrorCallback: onFetchColumnHeadersFailure,
        }),
      );
    },
    [
      onFetchColumnHeadersSuccess,
      onFetchColumnHeadersFailure,
      setIsFetchingColumnHeaderList,
      setErrorFetchingColumnHeaderList,
    ],
  );

  return {
    columnHeaderList,
    isFetchingColumnHeaderList,
    errorFetchingColumnHeaderList,
    fetchColumnHeaderList,
  };
};

const payload = [
  {
    value: "LIST_BUCKETS",
  },
];

export const useS3BucketList = () => {
  const dispatch = useDispatch();

  const [bucketList, setBucketList] = useState<Array<string>>([]);
  const [isFetchingBucketList, setIsFetchingBucketList] =
    useState<boolean>(false);
  const [failedFetchingBucketList, setFailedFetchingBucketList] =
    useState<boolean>(false);
  const onFetchBucketSuccess = useCallback(
    (
      payload: executeDatasourceQuerySuccessPayload<{
        bucketList: Array<string>;
      }>,
    ) => {
      setIsFetchingBucketList(false);
      if (payload.data && payload.data.body) {
        const payloadBody = payload.data.body;
        if (Array.isArray(payloadBody.bucketList)) {
          const { bucketList: list = [] } = payloadBody;
          setBucketList(list);
        }
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
              isGeneratePage: true,
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
