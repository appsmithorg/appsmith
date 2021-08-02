import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getEditorConfig } from "selectors/entitiesSelector";
import { AppState } from "reducers/index";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { fetchPluginFormConfig } from "actions/pluginActions";
import {
  executeDatasourceQuery,
  executeDatasourceQuerySuccessPayload,
} from "../../../../actions/datasourceActions";
import {
  DropdownOptions,
  DROPDOWN_DIMENSION,
  DEFAULT_DROPDOWN_OPTION,
} from "./constants";
import { SelectWrapper, Label, Bold } from "./GeneratePageForm/styles";

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

const mockSheetURL =
  "https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0";

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

type Props = {
  googleSheetPluginId: string;
  selectedDatasource: DropdownOption;
  setSelectedDatasourceIsInvalid: (isInvalid: boolean) => void;
  setSelectedDatasourceTableOptions: React.Dispatch<
    React.SetStateAction<DropdownOptions>
  >;
  selectedSpreadsheet: DropdownOption;
};

// ---------- GoogleSheetForm Component -------

function GoogleSheetForm(props: Props) {
  const {
    googleSheetPluginId,
    selectedDatasource,
    selectedSpreadsheet,
    setSelectedDatasourceIsInvalid,
    setSelectedDatasourceTableOptions,
  } = props;

  const [sheetsList, setSheetsList] = useState<DropdownOption[]>([]);

  const [selectedSheet, setSelectedSheet] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );
  const dispatch = useDispatch();

  const googleSheetEditorConfig = useSelector((state: AppState) =>
    getEditorConfig(state, googleSheetPluginId),
  );

  // TODO :- Create loading state and set Loading state false on success or error
  const onFetchAllSpreadsheetFailure = (error: any) => {
    console.log({ error });
  };

  const onFetchAllSpreadsheetSuccess = useCallback(
    (
      payload: executeDatasourceQuerySuccessPayload<
        Array<{ id: string; name: string }>
      >,
    ) => {
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
    [setSelectedDatasourceIsInvalid, setSelectedDatasourceTableOptions],
  );

  useEffect(() => {
    // Check if google sheet editor config is fetched.
    // if not, fetch it.

    if (!googleSheetEditorConfig) {
      dispatch(
        fetchPluginFormConfig({
          pluginId: selectedDatasource.data?.pluginId,
        }),
      );
    }
  }, [googleSheetEditorConfig]);

  useEffect(() => {
    // On change of datasource selection
    // if googleSheetEditorConfig if fetched then get all spreadsheets

    if (
      selectedDatasource.value &&
      selectedDatasource.id &&
      googleSheetEditorConfig
    ) {
      const requestData = { ...demoRequest };
      requestData.method = GOOGLE_SHEET_METHODS.GET_ALL_SPREADSHEETS;
      const formattedRequestData = Object.entries(
        requestData,
      ).map(([dataKey, dataValue]) => ({ key: dataKey, value: dataValue }));
      dispatch(
        executeDatasourceQuery({
          payload: {
            datasourceId: selectedDatasource.id,
            data: formattedRequestData,
          },
          onSuccessCallback: onFetchAllSpreadsheetSuccess,
          onErrorCallback: onFetchAllSpreadsheetFailure,
        }),
      );
    }
  }, [selectedDatasource.value, googleSheetEditorConfig, dispatch]);

  // TODO :- Create loading state and set Loading state false on success or error
  const onFetchAllSheetFailure = (error: any) => {
    console.log({ error });
  };

  const onFetchAllSheetSuccess = useCallback(
    (
      payload: executeDatasourceQuerySuccessPayload<{
        sheets: Sheets;
        name: string;
        id: string;
      }>,
    ) => {
      const sheetOptions: DropdownOptions = [];
      debugger;
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
    [setSelectedDatasourceIsInvalid, setSelectedDatasourceTableOptions],
  );

  // When user selects a spreadsheet
  // Fetch all sheets inside that spreadsheet
  useEffect(() => {
    if (
      selectedDatasource.value &&
      selectedDatasource.id &&
      selectedSpreadsheet.value &&
      selectedSpreadsheet.id
    ) {
      const requestData = { ...demoRequest };
      requestData.method = GOOGLE_SHEET_METHODS.GET_ALL_SHEETS;
      requestData.sheetUrl = mockSheetURL.replace(
        "SPREADSHEET_ID",
        selectedSpreadsheet.id,
      );
      const formattedRequestData = Object.entries(
        requestData,
      ).map(([dataKey, dataValue]) => ({ key: dataKey, value: dataValue }));
      debugger;
      dispatch(
        executeDatasourceQuery({
          payload: {
            datasourceId: selectedDatasource.id,
            data: formattedRequestData,
          },
          onSuccessCallback: onFetchAllSheetSuccess,
          onErrorCallback: onFetchAllSheetFailure,
        }),
      );
    }
  }, [
    selectedSpreadsheet.id,
    selectedSpreadsheet.value,
    selectedDatasource.id,
    selectedDatasource.value,
    dispatch,
  ]);

  const onSelectSheetOption = (
    sheetValue: string | undefined,
    sheetObj: DropdownOption | undefined,
  ) => {
    if (sheetValue && sheetObj) {
      setSelectedSheet(sheetObj);
    }
  };

  const onSelectColumn = () => {
    //
  };

  const selectedColumn = DEFAULT_DROPDOWN_OPTION;

  const selectedTableColumnOptions: DropdownOptions = [];

  return (
    <div>
      {selectedSpreadsheet.value ? (
        <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
          <Label>
            Select sheet from <Bold>{selectedSpreadsheet.label}</Bold>
          </Label>
          <Dropdown
            cypressSelector="t--table-dropdown"
            dropdownMaxHeight={"300px"}
            // errorMsg={tableDropdownErrorMsg}
            height={DROPDOWN_DIMENSION.HEIGHT}
            // isLoading={fetchingDatasourceConfigs}
            onSelect={onSelectSheetOption}
            optionWidth={DROPDOWN_DIMENSION.WIDTH}
            options={sheetsList}
            selected={selectedSheet}
            showLabelOnly
            width={DROPDOWN_DIMENSION.WIDTH}
          />
        </SelectWrapper>
      ) : null}

      {selectedSheet.value && (
        <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
          <Label>
            Select a searchable column from
            <Bold> {selectedSheet.label} </Bold>
          </Label>

          <Dropdown
            cypressSelector="t--searchColumn-dropdown"
            dropdownMaxHeight={"300px"}
            height={DROPDOWN_DIMENSION.HEIGHT}
            helperText="* Optional"
            onSelect={onSelectColumn}
            optionWidth={DROPDOWN_DIMENSION.WIDTH}
            options={selectedTableColumnOptions}
            selected={selectedColumn}
            showLabelOnly
            width={DROPDOWN_DIMENSION.WIDTH}
          />
        </SelectWrapper>
      )}
    </div>
  );
}

export default GoogleSheetForm;
