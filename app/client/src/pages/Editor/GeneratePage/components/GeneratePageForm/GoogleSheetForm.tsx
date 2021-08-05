import React, { useState, useEffect, ReactElement } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getEditorConfig } from "selectors/entitiesSelector";
import { AppState } from "reducers/index";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { fetchPluginFormConfig } from "actions/pluginActions";
import { DROPDOWN_DIMENSION, DEFAULT_DROPDOWN_OPTION } from "../constants";
import { SelectWrapper, Label, Bold } from "./styles";
import TextInput from "components/ads/TextInput";
import { GeneratePagePayload } from "./types";
import { getSheetUrl } from "./hooks";
import {
  UseSheetListReturn,
  UseSpreadSheetsReturn,
  UseSheetColumnHeadersReturn,
} from "./hooks";

type Props = {
  googleSheetPluginId: string;
  selectedDatasource: DropdownOption;
  selectedSpreadsheet: DropdownOption;
  generatePageAction: (payload: GeneratePagePayload) => void;
  renderSubmitButton: ({
    onSubmit,
  }: {
    onSubmit: () => void;
  }) => ReactElement<any, any>;
  sheetsListProps: UseSheetListReturn;
  spreadSheetsProps: UseSpreadSheetsReturn;
  sheetColumnsHeaderProps: UseSheetColumnHeadersReturn;
};

// ---------- GoogleSheetForm Component -------

function GoogleSheetForm(props: Props) {
  const {
    generatePageAction,
    googleSheetPluginId,
    renderSubmitButton,
    selectedDatasource,
    selectedSpreadsheet,
    sheetColumnsHeaderProps,
    sheetsListProps,
    spreadSheetsProps,
  } = props;

  const { fetchSheetsList, isFetchingSheetsList, sheetsList } = sheetsListProps;
  const { fetchAllSpreadsheets } = spreadSheetsProps;
  const {
    columnHeaderList,
    fetchColumnHeaderList,
    isFetchingColumnHeaderList,
  } = sheetColumnsHeaderProps;

  const [tableHeaderIndex, setTableHeaderIndex] = useState<string>("1");
  const [selectedSheet, setSelectedSheet] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );
  const dispatch = useDispatch();

  const googleSheetEditorConfig = useSelector((state: AppState) =>
    getEditorConfig(state, googleSheetPluginId),
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
      fetchAllSpreadsheets({ selectedDatasourceId: selectedDatasource.id });
    }
  }, [selectedDatasource.value, googleSheetEditorConfig, dispatch]);

  // When user selects a spreadsheet
  // Fetch all sheets inside that spreadsheet
  useEffect(() => {
    if (
      selectedDatasource.value &&
      selectedDatasource.id &&
      selectedSpreadsheet.value &&
      selectedSpreadsheet.id
    ) {
      setSelectedSheet(DEFAULT_DROPDOWN_OPTION);
      fetchSheetsList({
        selectedDatasourceId: selectedDatasource.id,
        selectedSpreadsheetId: selectedSpreadsheet.id,
      });
    }
  }, [
    selectedSpreadsheet.id,
    selectedSpreadsheet.value,
    selectedDatasource.id,
    selectedDatasource.value,
    dispatch,
    fetchSheetsList,
  ]);

  const onSelectSheetOption = (
    sheetValue: string | undefined,
    sheetObj: DropdownOption | undefined,
  ) => {
    if (sheetValue && sheetObj) {
      setSelectedSheet(sheetObj);
      if (selectedDatasource.id && selectedSpreadsheet.id) {
        fetchColumnHeaderList({
          selectedDatasourceId: selectedDatasource.id,
          selectedSpreadsheetId: selectedSpreadsheet.id,
          sheetName: sheetValue,
          tableHeaderIndex,
        });
      }
    }
  };

  const onSelectColumn = () => {
    //
  };

  const selectedColumn = DEFAULT_DROPDOWN_OPTION;

  const onSubmit = () => {
    if (selectedSpreadsheet.id) {
      const columns: string[] = [];
      columnHeaderList.forEach(({ value }) => {
        if (value) columns.push(value);
      });
      const payload = {
        columns,
        searchColumn: "",
        tableName: selectedSpreadsheet.value || "",
        pluginSpecificParams: {
          sheetUrl: getSheetUrl(selectedSpreadsheet.id),
          tableHeaderIndex,
          sheetName: selectedSheet.value,
        },
      };
      generatePageAction(payload);
    }
  };

  const tableHeaderIndexChangeHandler = (value: string) => {
    setTableHeaderIndex(value);
    if (
      selectedDatasource.id &&
      selectedSpreadsheet.id &&
      selectedSheet.value
    ) {
      fetchColumnHeaderList({
        selectedDatasourceId: selectedDatasource.id,
        selectedSpreadsheetId: selectedSpreadsheet.id,
        sheetName: selectedSheet.value,
        tableHeaderIndex: value,
      });
    }
  };

  return (
    <>
      {selectedSpreadsheet.value ? (
        <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
          <Label>
            Select sheet from <Bold>{selectedSpreadsheet.label}</Bold>
          </Label>
          <Dropdown
            cypressSelector="t--table-dropdown"
            dropdownMaxHeight={"300px"}
            height={DROPDOWN_DIMENSION.HEIGHT}
            isLoading={isFetchingSheetsList}
            onSelect={onSelectSheetOption}
            optionWidth={DROPDOWN_DIMENSION.WIDTH}
            options={sheetsList}
            selected={selectedSheet}
            showLabelOnly
            width={DROPDOWN_DIMENSION.WIDTH}
          />
        </SelectWrapper>
      ) : null}

      {selectedSheet.value ? (
        <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
          <Label>Table Header Index</Label>
          <TextInput
            cypressSelector="t--org-website-input"
            dataType="number"
            defaultValue={tableHeaderIndex}
            fill
            onChange={tableHeaderIndexChangeHandler}
            placeholder="Table Header Index"
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
            disabled={columnHeaderList.length === 0}
            dropdownMaxHeight={"300px"}
            height={DROPDOWN_DIMENSION.HEIGHT}
            isLoading={isFetchingColumnHeaderList}
            // helperText="* Optional"
            onSelect={onSelectColumn}
            optionWidth={DROPDOWN_DIMENSION.WIDTH}
            options={columnHeaderList}
            selected={selectedColumn}
            showLabelOnly
            width={DROPDOWN_DIMENSION.WIDTH}
          />
        </SelectWrapper>
      )}
      {selectedSheet.value && columnHeaderList.length
        ? renderSubmitButton({ onSubmit })
        : null}
    </>
  );
}

export default GoogleSheetForm;
