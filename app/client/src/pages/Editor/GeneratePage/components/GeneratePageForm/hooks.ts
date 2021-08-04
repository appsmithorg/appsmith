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
  sheetsName: "",
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
  const onFetchAllSpreadsheetFailure = useCallback(
    (error: any) => {
      setIsFetchingSpreadsheets(false);
      setFailedFetchingSpreadsheets(true);
    },
    [setIsFetchingSpreadsheets],
  );

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

const getSheetUrl = (sheetId: string) =>
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

  // TODO :- Create loading state and set Loading state false on success or error
  const onFetchAllSheetFailure = useCallback(
    (error: any) => {
      setIsFetchingSheetsList(false);
      setFailedFetchingSheetsList(true);
    },
    [setIsFetchingSheetsList],
  );

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
    },
    [setSheetsList, setIsFetchingSheetsList],
  );

  const fetchSheetsList = useCallback(
    ({ selectedDatasourceId, selectedSpreadsheetId }) => {
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
