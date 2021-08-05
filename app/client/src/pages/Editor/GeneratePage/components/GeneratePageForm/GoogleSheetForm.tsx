import React, { useState, useEffect, ReactElement } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getEditorConfig } from "selectors/entitiesSelector";
import { AppState } from "reducers/index";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { fetchPluginFormConfig } from "actions/pluginActions";
import {
  DropdownOptions,
  DROPDOWN_DIMENSION,
  DEFAULT_DROPDOWN_OPTION,
} from "../constants";
import { SelectWrapper, Label, Bold } from "./styles";
// import TextInput from "components/ads/TextInput";
import { GeneratePagePayload } from "./types";
import { UseSheetListReturn, UseSpreadSheetsReturn } from "./hooks";

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
};

// ---------- GoogleSheetForm Component -------

function GoogleSheetForm(props: Props) {
  const {
    generatePageAction,
    googleSheetPluginId,
    renderSubmitButton,
    selectedDatasource,
    selectedSpreadsheet,
    sheetsListProps,
    spreadSheetsProps,
  } = props;

  const { fetchSheetsList, isFetchingSheetsList, sheetsList } = sheetsListProps;
  const { fetchAllSpreadsheets } = spreadSheetsProps;

  // const [tableHeaderIndex, setTableHeaderIndex] = useState<string>("0");
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
    }
  };

  const onSelectColumn = () => {
    //
  };

  const selectedColumn = DEFAULT_DROPDOWN_OPTION;

  const selectedTableColumnOptions: DropdownOptions = [];

  const onSubmit = () => {
    const payload = {
      columns: [],
      searchColumn: selectedColumn.value,
      tableName: selectedSpreadsheet.value || "",
    };
    generatePageAction(payload);
  };

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

      {/* {selectedSheet.value ? (
        <>
          <Label>Table Header Index</Label>
          <TextInput
            cypressSelector="t--org-website-input"
            dataType="number"
            defaultValue={tableHeaderIndex}
            onChange={(value) => setTableHeaderIndex(value)}
            placeholder="Table Header Index"
          />
        </>
      ) : null} */}

      {selectedSheet.value && (
        <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
          <Label>
            Select a searchable column from
            <Bold> {selectedSheet.label} </Bold>
          </Label>

          <Dropdown
            cypressSelector="t--searchColumn-dropdown"
            disabled={selectedTableColumnOptions.length === 0}
            dropdownMaxHeight={"300px"}
            height={DROPDOWN_DIMENSION.HEIGHT}
            // helperText="* Optional"
            onSelect={onSelectColumn}
            optionWidth={DROPDOWN_DIMENSION.WIDTH}
            options={selectedTableColumnOptions}
            selected={selectedColumn}
            showLabelOnly
            width={DROPDOWN_DIMENSION.WIDTH}
          />
        </SelectWrapper>
      )}
      {renderSubmitButton({ onSubmit })}
    </div>
  );
}

export default GoogleSheetForm;
