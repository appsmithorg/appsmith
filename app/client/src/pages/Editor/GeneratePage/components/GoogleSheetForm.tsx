import React, { useEffect } from "react";
import styled from "styled-components";
import Dropdown from "components/ads/Dropdown";
import { getTypographyByKey } from "constants/DefaultTheme";
import { useSelector, useDispatch } from "react-redux";
import {
  getEditorConfig,
  getIsFetchingSinglePluginForm,
} from "selectors/entitiesSelector";
import { AppState } from "reducers/index";
import { DropdownOption } from "components/ads/Dropdown";
import { fetchPluginFormConfig } from "actions/pluginActions";
import {
  executeDatasourceQuery,
  executeDatasourceQuerySuccessPayload,
} from "../../../../actions/datasourceActions";
import { DropdownOptions, DatasourceTableDropdownOption } from "./constants";

// const GOOGLE_SHEET_METHODS = {
//   GET_ALL_SPREADSHEETS: "LIST", // Get all the spreadsheets
//   GET_ALL_SHEETS: "INFO", // fetch all the sub-sheets
//   GET_ALL_COLUMNS: "GET", // Get column names
// };

const DEMO_LIST_DATA = [
  {
    key: "method",
    value: "LIST",
  },
  {
    key: "sheetUrl",
  },
  {
    key: "range",
    value: "",
  },
  {
    key: "spreadsheetName",
    value: "",
  },
  {
    key: "tableHeaderIndex",
    value: "1",
  },
  {
    key: "queryFormat",
    value: "ROWS",
  },
  {
    key: "rowLimit",
    value: "",
  },
  {
    key: "sheetName",
    value: "",
  },
  {
    key: "rowOffset",
    value: "",
  },
  {
    key: "rowObject",
  },
  {
    key: "rowObjects",
  },
  {
    key: "rowIndex",
    value: "",
  },
  {
    key: "deleteFormat",
    value: "SHEET",
  },
];

const DROPDOWN_DIMENSION = {
  HEIGHT: "36px",
  WIDTH: "404px",
};
//  ---------- Styles ----------

const SelectWrapper = styled.div`
  margin: 10px;
`;

const Label = styled.p`
  ${(props) => `${getTypographyByKey(props, "p1")}`}
`;

const Bold = styled.span`
  font-weight: 500;
`;

// Types

type Props = {
  columnLabel: string;
  datasourceTableOptions: DropdownOptions;
  googleSheetPluginId: string;
  isFetchingDatasourceStructure: boolean;
  onSelectColumn: (
    table: string | undefined,
    ColumnObj: DropdownOption | undefined,
  ) => void;
  onSelectTable: (
    table: string | undefined,
    TableObj: DatasourceTableDropdownOption,
  ) => void;
  selectedColumn: DropdownOption;
  selectedDatasource: DropdownOption;
  selectedTable: DropdownOption;
  selectedTableColumnOptions: DropdownOptions;
  tableDropdownErrorMsg: string;
  tableLabel: string;
  setSelectedDatasourceTableOptions: React.Dispatch<
    React.SetStateAction<DropdownOptions>
  >;
};

// ---------- GoogleSheetForm Component -------

function GoogleSheetForm(props: Props) {
  const {
    columnLabel,
    datasourceTableOptions,
    googleSheetPluginId,
    isFetchingDatasourceStructure,
    onSelectColumn,
    onSelectTable,
    selectedColumn,
    selectedDatasource,
    selectedTable,
    selectedTableColumnOptions,
    setSelectedDatasourceTableOptions,
    tableDropdownErrorMsg,
    tableLabel,
  } = props;

  const dispatch = useDispatch();

  const googleSheetEditorConfig = useSelector((state: AppState) =>
    getEditorConfig(state, googleSheetPluginId),
  );

  const isFetchingSheetPluginForm = useSelector((state: AppState) =>
    getIsFetchingSinglePluginForm(state, googleSheetPluginId),
  );

  // TODO :- Create loading state and set Loading state false on success or error
  const onFetchAllSpreadsheetFailure = (error: any) => {
    console.log({ error });
  };

  const onFetchAllSpreadsheetSuccess = (
    payload: executeDatasourceQuerySuccessPayload,
  ) => {
    const tableOptions: DropdownOptions = [];
    if (payload.data && payload.data.body) {
      const spreadSheets = payload.data.body;
      spreadSheets.map(({ id, name }) => {
        tableOptions.push({
          id,
          label: name,
          value: id,
        });
        setSelectedDatasourceTableOptions(tableOptions);
      });
    }
  };

  useEffect(() => {
    // On change of datasource selection
    // Check if google sheet editor config is fetched.
    //    if NO, Check if new selected datasource is google sheet.
    //        if YES => fetch google sheet editor config.
    //    if YES, Get all spreadsheets

    if (!googleSheetEditorConfig) {
      dispatch(
        fetchPluginFormConfig({
          pluginId: selectedDatasource.data?.pluginId,
        }),
      );
    } else {
      // Get all the spreadsheets
      if (selectedDatasource.id) {
        dispatch(
          executeDatasourceQuery({
            payload: {
              datasourceId: selectedDatasource.id,
              data: DEMO_LIST_DATA,
            },
            onSuccessCallback: onFetchAllSpreadsheetSuccess,
            onErrorCallback: onFetchAllSpreadsheetFailure,
          }),
        );
      }
    }
  }, [selectedDatasource.value, googleSheetEditorConfig, dispatch]);

  return (
    <>
      {selectedDatasource.value ? (
        <SelectWrapper>
          <Label>
            Select {tableLabel} from <Bold>{selectedDatasource.label}</Bold>
          </Label>
          <Dropdown
            dropdownMaxHeight={"300px"}
            errorMsg={tableDropdownErrorMsg}
            height={DROPDOWN_DIMENSION.HEIGHT}
            isLoading={
              isFetchingDatasourceStructure || isFetchingSheetPluginForm
            }
            onSelect={onSelectTable}
            optionWidth={DROPDOWN_DIMENSION.WIDTH}
            options={datasourceTableOptions}
            selected={selectedTable}
            showLabelOnly
            width={DROPDOWN_DIMENSION.WIDTH}
          />
        </SelectWrapper>
      ) : null}

      {selectedTable.value ? (
        <SelectWrapper>
          <Label>
            Select a searchable {columnLabel} from
            <Bold> {selectedTable.label} </Bold>
          </Label>
          <Dropdown
            dropdownMaxHeight={"300px"}
            height={DROPDOWN_DIMENSION.HEIGHT}
            onSelect={onSelectColumn}
            optionWidth={DROPDOWN_DIMENSION.WIDTH}
            options={selectedTableColumnOptions}
            selected={selectedColumn}
            showLabelOnly
            width={DROPDOWN_DIMENSION.WIDTH}
          />
        </SelectWrapper>
      ) : null}
    </>
  );
}

export default GoogleSheetForm;
