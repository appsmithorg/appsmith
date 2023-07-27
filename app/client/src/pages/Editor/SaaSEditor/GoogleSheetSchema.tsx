import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import type { DropdownOption } from "design-system-old";
import { Option, Select } from "design-system";
import {
  useSheetData,
  useSheetsList,
  useSpreadSheets,
} from "../GeneratePage/components/GeneratePageForm/hooks";
import type {
  DatasourceTableDropdownOption,
  DropdownOptions,
} from "../GeneratePage/components/constants";
import {
  DEFAULT_DROPDOWN_OPTION,
  DROPDOWN_DIMENSION,
} from "../GeneratePage/components/constants";
import { SelectWrapper } from "../GeneratePage/components/GeneratePageForm/styles";
import { isEmpty } from "lodash";
import DataTable from "./DataTable";

type Props = {
  datasourceId: string;
  pluginId?: string;
};

// ---------- GoogleSheetSchema Component -------

function GoogleSheetSchema(props: Props) {
  const [datasourceTableOptions, setSelectedDatasourceTableOptions] =
    useState<DropdownOptions>([]);
  const [selectedDatasourceIsInvalid, setSelectedDatasourceIsInvalid] =
    useState(false);
  const { fetchSheetsList, isFetchingSheetsList, sheetsList } = useSheetsList();
  const { fetchAllSpreadsheets, isFetchingSpreadsheets } = useSpreadSheets({
    setSelectedDatasourceTableOptions,
    setSelectedDatasourceIsInvalid,
  });
  const { fetchSheetData, isFetchingSheetData } = useSheetData();
  const [selectedSpreadsheet, setSelectedSpreadsheet] =
    useState<DropdownOption>({});
  const [selectedSheet, setSelectedSheet] = useState<DropdownOption>({});

  const dispatch = useDispatch();

  // Fetch spreadsheets if datasourceId present
  useEffect(() => {
    if (!!props.datasourceId && !!props.pluginId) {
      fetchAllSpreadsheets({
        selectedDatasourceId: props.datasourceId,
        pluginId: props.pluginId || "",
        requestObject: {},
      });
    }
  }, [props.datasourceId, props.pluginId, dispatch]);

  // When user selects a spreadsheet
  // Fetch all sheets inside that spreadsheet
  useEffect(() => {
    if (!!props.datasourceId && !!props.pluginId && selectedSpreadsheet.value) {
      setSelectedSheet(DEFAULT_DROPDOWN_OPTION);
      fetchSheetsList({
        requestObject: {},
        selectedDatasourceId: props.datasourceId,
        selectedSpreadsheetUrl: selectedSpreadsheet.value,
        pluginId: props.pluginId,
      });
    }
  }, [
    selectedSpreadsheet.value,
    props.datasourceId,
    props.pluginId,
    dispatch,
    fetchSheetsList,
  ]);

  // When user selects a sheet name
  // Fetch all sheet data inside that sheet
  useEffect(() => {
    if (!!props.datasourceId && !!props.pluginId && selectedSheet.value) {
      setSelectedSheet(DEFAULT_DROPDOWN_OPTION);
      fetchSheetData({
        selectedDatasourceId: props.datasourceId,
        selectedSpreadsheetUrl: selectedSpreadsheet.value || "",
        selectedSheetName: selectedSheet.value,
        pluginId: props.pluginId || "",
      });
    }
  }, [
    selectedSheet.value,
    props.datasourceId,
    props.pluginId,
    dispatch,
    fetchSheetData,
  ]);

  // Set first spreadsheet as default option in the dropdown
  useEffect(() => {
    if (datasourceTableOptions?.length > 0 && isEmpty(selectedSpreadsheet)) {
      setSelectedSpreadsheet(datasourceTableOptions[0]);
    }
  }, [selectedSpreadsheet, datasourceTableOptions]);

  // Set first sheet as default option in the dropdown
  useEffect(() => {
    if (sheetsList?.length > 0) {
      setSelectedSheet(sheetsList[0]);
    }
  }, [selectedSheet, sheetsList]);

  const onSelectSpreadsheet = (
    table: string | undefined,
    TableObj: DatasourceTableDropdownOption | undefined,
  ) => {
    if (table && TableObj) {
      setSelectedSpreadsheet(TableObj);
    }
  };

  const onSelectSheetOption = (
    sheetValue: string | undefined,
    sheetObj: DropdownOption | undefined,
  ) => {
    if (sheetValue && sheetObj) {
      setSelectedSheet(sheetObj);
    }
  };

  return (
    <>
      {selectedDatasourceIsInvalid && <div>Invalid Datasource</div>}
      {!!props.datasourceId ? (
        <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
          <Select
            data-testid="t--table-dropdown"
            isLoading={isFetchingSpreadsheets}
            onChange={(value) =>
              onSelectSpreadsheet(
                value,
                datasourceTableOptions.find(
                  (table) => table.value === value,
                ) as DatasourceTableDropdownOption,
              )
            }
            value={selectedSpreadsheet}
          >
            {datasourceTableOptions.map((table) => {
              return (
                <Option key={table.value} value={table.value}>
                  {table.label}
                </Option>
              );
            })}
          </Select>
        </SelectWrapper>
      ) : null}
      {selectedSpreadsheet.value ? (
        <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
          <Select
            data-testid="t--sheetName-dropdown"
            isLoading={isFetchingSheetsList}
            onChange={(value) =>
              onSelectSheetOption(
                value,
                sheetsList.find(
                  (sheet: DropdownOption) => sheet.value === value,
                ),
              )
            }
            value={selectedSheet}
          >
            {sheetsList.map((sheet) => {
              return (
                <Option key={sheet.label} value={sheet.label}>
                  {sheet?.label}
                </Option>
              );
            })}
          </Select>
        </SelectWrapper>
      ) : null}
      {isFetchingSheetData ? <div>Loading</div> : <DataTable />}
    </>
  );
}

export default GoogleSheetSchema;
