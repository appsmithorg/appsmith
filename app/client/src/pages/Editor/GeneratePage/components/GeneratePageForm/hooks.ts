import { useEffect, useState, useCallback } from "react";
import { DropdownOptions } from "../constants";
import { Datasource } from "entities/Datasource";
import { GenerateCRUDEnabledPluginMap } from "api/PluginApi";
import { CONNECT_NEW_DATASOURCE_OPTION_ID } from "../DataSourceOption";
import {
  executeDatasourceQuery,
  executeDatasourceQuerySuccessPayload,
} from "actions/datasourceActions";
import { DropdownOption } from "components/ads/Dropdown";
import { useDispatch } from "react-redux";
import { isObject } from "lodash";

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

const GOOGLE_SHEET_METHODS = {
  GET_ALL_SPREADSHEETS: "LIST", // Get all the spreadsheets
  GET_ALL_SHEETS: "INFO", // fetch all the sub-sheets
  GET_ALL_COLUMNS: "GET", // Get column names
};

const demoRequest = {
  method: "",
  sheetUrl: "",
  range: "",
  spreadsheetName: "",
  tableHeaderIndex: "1",
  queryFormat: "ROWS",
  rowLimit: "",
  sheetName: "",
  rowOffset: "",
  rowObject: "",
  rowObjects: "",
  rowIndex: "",
  deleteFormat: "SHEET",
};

export type UseSpreadSheetsReturn = {
  fetchAllSpreadsheets: ({
    selectedDatasourceId,
  }: {
    selectedDatasourceId: string;
  }) => void;
  isFetchingSpreadsheets: boolean;
  failedFetchingSpreadsheets: boolean;
};

export const useSpreadSheets = ({
  setSelectedDatasourceIsInvalid,
  setSelectedDatasourceTableOptions,
}: {
  setSelectedDatasourceIsInvalid: (isInvalid: boolean) => void;
  setSelectedDatasourceTableOptions: (tableOptions: DropdownOptions) => void;
}): UseSpreadSheetsReturn => {
  const dispatch = useDispatch();

  // const [spreadsheetsList, setSpreadsheets] = useState<DropdownOption[]>([]);

  const [isFetchingSpreadsheets, setIsFetchingSpreadsheets] = useState<boolean>(
    false,
  );
  const [failedFetchingSpreadsheets, setFailedFetchingSpreadsheets] = useState<
    boolean
  >(false);

  // TODO :- Create loading state and set Loading state false on success or error
  const onFetchAllSpreadsheetFailure = useCallback(() => {
    setIsFetchingSpreadsheets(false);
    setFailedFetchingSpreadsheets(true);
  }, [setIsFetchingSpreadsheets]);

  const onFetchAllSpreadsheetSuccess = useCallback(
    (
      payload: executeDatasourceQuerySuccessPayload<
        Array<{ id: string; name: string }>
      >,
    ) => {
      setIsFetchingSpreadsheets(false);

      const tableOptions: DropdownOptions = [];
      if (payload.data && payload.data.body) {
        const spreadSheets = payload.data.body;

        if (Array.isArray(spreadSheets)) {
          spreadSheets.map(({ id, name }) => {
            tableOptions.push({
              id,
              label: name,
              value: name,
            });
            setSelectedDatasourceTableOptions(tableOptions);
          });
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
    ({ selectedDatasourceId }: { selectedDatasourceId: string }) => {
      setIsFetchingSpreadsheets(true);
      setFailedFetchingSpreadsheets(false);

      const requestData = { ...demoRequest };
      requestData.method = GOOGLE_SHEET_METHODS.GET_ALL_SPREADSHEETS;
      const formattedRequestData = Object.entries(
        requestData,
      ).map(([dataKey, dataValue]) => ({ key: dataKey, value: dataValue }));
      dispatch(
        executeDatasourceQuery({
          payload: {
            datasourceId: selectedDatasourceId,
            data: formattedRequestData,
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

export type UseSheetListReturn = {
  sheetsList: DropdownOption[];
  isFetchingSheetsList: boolean;
  failedFetchingSheetsList: boolean;
  fetchSheetsList: ({
    selectedDatasourceId,
    selectedSpreadsheetId,
  }: {
    selectedDatasourceId: string;
    selectedSpreadsheetId: string;
  }) => void;
};

export const useSheetsList = (): UseSheetListReturn => {
  const dispatch = useDispatch();

  const [sheetsList, setSheetsList] = useState<DropdownOption[]>([]);

  const [isFetchingSheetsList, setIsFetchingSheetsList] = useState<boolean>(
    false,
  );
  const [failedFetchingSheetsList, setFailedFetchingSheetsList] = useState<
    boolean
  >(false);

  const onFetchAllSheetFailure = useCallback(() => {
    setIsFetchingSheetsList(false);
    setFailedFetchingSheetsList(true);
  }, [setIsFetchingSheetsList]);

  const onFetchAllSheetSuccess = useCallback(
    (
      payload: executeDatasourceQuerySuccessPayload<{
        sheets: Sheets;
        name: string;
        id: string;
      }>,
    ) => {
      setIsFetchingSheetsList(false);
      const sheetOptions: DropdownOptions = [];

      if (payload.data && payload.data.body) {
        const responseBody = payload.data.body;
        if (isObject(responseBody)) {
          const { sheets = [] } = responseBody;
          if (Array.isArray(sheets)) {
            sheets.map(({ title }) => {
              sheetOptions.push({
                id: title,
                label: title,
                value: title,
              });
              setSheetsList(sheetOptions);
            });
          } else {
            // to handle error like "401 Unauthorized"
          }
        }
      }
    },
    [setSheetsList, setIsFetchingSheetsList],
  );

  const fetchSheetsList = useCallback(
    ({ selectedDatasourceId, selectedSpreadsheetId }) => {
      setSheetsList([]);
      setIsFetchingSheetsList(true);
      setFailedFetchingSheetsList(false);

      const requestData = { ...demoRequest };
      requestData.method = GOOGLE_SHEET_METHODS.GET_ALL_SHEETS;
      requestData.sheetUrl = getSheetUrl(selectedSpreadsheetId);
      const formattedRequestData = Object.entries(
        requestData,
      ).map(([dataKey, dataValue]) => ({ key: dataKey, value: dataValue }));
      dispatch(
        executeDatasourceQuery({
          payload: {
            datasourceId: selectedDatasourceId,
            data: formattedRequestData,
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

export type FetchColumnHeaderListParams = {
  selectedDatasourceId: string;
  selectedSpreadsheetId: string;
  sheetName: string;
  tableHeaderIndex: string;
};

export type UseSheetColumnHeadersReturn = {
  columnHeaderList: DropdownOption[];
  isFetchingColumnHeaderList: boolean;
  errorFetchingColumnHeaderList: string;
  fetchColumnHeaderList: ({
    selectedDatasourceId,
    selectedSpreadsheetId,
    sheetName,
    tableHeaderIndex,
  }: FetchColumnHeaderListParams) => void;
};

export const useSheetColumnHeaders = () => {
  const dispatch = useDispatch();

  const [columnHeaderList, setColumnHeaderList] = useState<DropdownOption[]>(
    [],
  );

  const [isFetchingColumnHeaderList, setIsFetchingColumnHeaderList] = useState<
    boolean
  >(false);
  const [
    errorFetchingColumnHeaderList,
    setErrorFetchingColumnHeaderList,
  ] = useState<string>("");

  const onFetchColumnHeadersFailure = useCallback(
    (error: string) => {
      setIsFetchingColumnHeaderList(false);
      setErrorFetchingColumnHeaderList(error);
    },
    [setErrorFetchingColumnHeaderList, setIsFetchingColumnHeaderList],
  );

  const onFetchColumnHeadersSuccess = useCallback(
    (
      payload: executeDatasourceQuerySuccessPayload<Record<string, string>[]>,
    ) => {
      setIsFetchingColumnHeaderList(false);
      const columnHeaders: DropdownOptions = [];

      if (payload.data && payload.data.body) {
        const responseBody = payload.data.body;
        if (Array.isArray(responseBody) && responseBody.length) {
          const headersObject = responseBody[0];
          delete headersObject.rowIndex;
          const headers = Object.keys(headersObject);
          if (Array.isArray(headers) && headers.length) {
            headers.map((header, index) => {
              columnHeaders.push({
                id: `${header}_${index}`,
                label: header,
                value: header,
              });
            });
            setColumnHeaderList(columnHeaders);
          }
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

      const requestData = { ...demoRequest };
      requestData.method = GOOGLE_SHEET_METHODS.GET_ALL_COLUMNS;
      requestData.sheetUrl = getSheetUrl(params.selectedSpreadsheetId);
      requestData.tableHeaderIndex = params.tableHeaderIndex;
      requestData.rowLimit = "1";
      requestData.rowOffset = "0";
      requestData.sheetName = params.sheetName;

      const formattedRequestData = Object.entries(
        requestData,
      ).map(([dataKey, dataValue]) => ({ key: dataKey, value: dataValue }));
      dispatch(
        executeDatasourceQuery({
          payload: {
            datasourceId: params.selectedDatasourceId,
            data: formattedRequestData,
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
