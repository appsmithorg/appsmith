import { Button, SearchInput } from "@appsmith/ads";
import type { DropdownOption } from "@appsmith/ads-old";
import { setEntityCollapsibleState } from "actions/editorContextActions";
import {
  createMessage,
  GSHEET_SEARCH_PLACEHOLDER,
} from "ee/constants/messages";
import { getDatasource } from "ee/selectors/entitiesSelector";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { isEmpty } from "lodash";
import Table from "PluginActionEditor/components/PluginActionResponse/components/Table";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Entity from "../Explorer/Entity";
import type { DropdownOptions } from "../GeneratePage/components/constants";
import { DEFAULT_DROPDOWN_OPTION } from "../GeneratePage/components/constants";
import {
  useSheetData,
  useSheetsList,
  useSpreadSheets,
} from "../GeneratePage/components/GeneratePageForm/hooks";
import DatasourceField from "./DatasourceField";
import DatasourceStructureHeader from "./DatasourceStructureHeader";
import ItemLoadingIndicator from "./ItemLoadingIndicator";
import RenderInterimDataState from "./RenderInterimDataState";
import {
  DatasourceAttributesWrapper,
  DatasourceDataContainer,
  DatasourceListContainer,
  DatasourceStructureSearchContainer,
  DataWrapperContainer,
  StructureContainer,
  TableWrapper,
  ViewModeSchemaContainer,
} from "./SchemaViewModeCSS";

interface Props {
  datasourceId: string;
  pluginId?: string;
}

const MAX_SHEET_ROWS_LENGTH = 12;

// ---------- GoogleSheetSchema Component -------

function GoogleSheetSchema(props: Props) {
  const [spreadsheetOptions, setSpreadsheetOptions] = useState<DropdownOptions>(
    [],
  );
  const [sheetOptions, setSheetOptions] = useState<DropdownOptions>([]);
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sheetData, setSheetData] = useState<any>([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] =
    useState<DropdownOption>({});
  const [selectedSheet, setSelectedSheet] = useState<DropdownOption>({});
  const [searchString, setSearchString] = useState<string>("");
  const [selectedDatasourceIsInvalid, setSelectedDatasourceIsInvalid] =
    useState(false);
  const { fetchAllSpreadsheets, isFetchingSpreadsheets } = useSpreadSheets({
    setSelectedDatasourceTableOptions: setSpreadsheetOptions,
    setSelectedDatasourceIsInvalid,
  });

  const toggleOnUnmountRefObject = useRef<{
    selectedSheet?: string;
    selectedSpreadSheet?: string;
  }>({});

  const handleSearch = (value: string) => {
    setSearchString(value.toLowerCase());

    AnalyticsUtil.logEvent("GSHEET_SPREADSHEET_SEARCH", {
      datasourceId: props.datasourceId,
      pluginId: props.pluginId,
    });
  };

  const setSlicedSheetData = (response: DropdownOptions) => {
    // Getting the top 12 rows as for experimentation we need to keep this number fixed for preview
    AnalyticsUtil.logEvent("GSHEET_PREVIEW_DATA_SHOWN", {
      datasourceId: props.datasourceId,
      pluginId: props.pluginId,
    });
    setSheetData(response.slice(0, MAX_SHEET_ROWS_LENGTH));
  };

  const { failedFetchingSheetsList, fetchSheetsList, isFetchingSheetsList } =
    useSheetsList({ setSheetOptions });
  const { failedFetchingSheetData, fetchSheetData, isFetchingSheetData } =
    useSheetData({
      setSheetData: setSlicedSheetData,
    });

  const datasource = useSelector((state) =>
    getDatasource(state, props.datasourceId),
  );

  const dispatch = useDispatch();

  const scrollIntoView = (
    elementId: string,
    containerId: string,
    offset: number = 0,
  ) => {
    try {
      const element = document.querySelector(elementId);
      const container = document.querySelector(containerId);

      if (element && container) {
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const scrollTop = container.scrollTop;

        const scrollAmount =
          elementRect.top - containerRect.top + scrollTop + offset;

        container.scrollTop = scrollAmount;
      }
    } catch {}
  };

  const collapseAccordions = (
    datasourceId: string,
    spreadSheet?: string,
    sheet?: string,
    collapseSpreadsheet: boolean = true,
  ) => {
    if (!isEmpty(spreadSheet) && !isEmpty(sheet)) {
      dispatch(
        setEntityCollapsibleState(
          `${datasourceId}-${spreadSheet}-${sheet}`,
          false,
        ),
      );
    }

    if (!isEmpty(spreadSheet) && collapseSpreadsheet) {
      dispatch(
        setEntityCollapsibleState(`${datasourceId}-${spreadSheet}`, false),
      );
    }
  };

  const selectSpreadsheetAndToggle = (option: DropdownOption) => {
    collapseAccordions(
      datasource?.id || "",
      selectedSpreadsheet.value,
      selectedSheet.value,
    );
    setSheetOptions([]);
    setSelectedSheet(DEFAULT_DROPDOWN_OPTION);
    setSheetData(undefined);
    dispatch(
      setEntityCollapsibleState(`${datasource?.id}-${option.value}`, true),
    );
    scrollIntoView(
      `#${CSS.escape(`entity-${datasource?.id}-${option.value}`)}`,
      ".t--gsheet-structure .t--gsheet-structure-list",
    );
    setSelectedSpreadsheet(option);
    fetchSheetsList({
      requestObject: {},
      selectedDatasourceId: props.datasourceId,
      selectedSpreadsheetUrl: option.value || "",
      pluginId: props.pluginId || "",
    });
  };

  const selectSheetAndToggle = (option: DropdownOption) => {
    collapseAccordions(
      datasource?.id || "",
      selectedSpreadsheet.value,
      selectedSheet.value,
      false,
    );
    dispatch(
      setEntityCollapsibleState(
        `${datasource?.id}-${selectedSpreadsheet.value}-${option.value}`,
        true,
      ),
    );
    scrollIntoView(
      `#${CSS.escape(
        `entity-${datasource?.id}-${selectedSpreadsheet.value}-${option.value}`,
      )}`,
      ".t--gsheet-structure .t--gsheet-structure-list",
      -30,
    );
    setSelectedSheet(option);
    setSheetData(undefined);
    fetchSheetData({
      selectedDatasourceId: datasource?.id || "",
      selectedSpreadsheetUrl: selectedSpreadsheet.value || "",
      selectedSheetName: option.value || "",
      pluginId: props.pluginId || "",
    });
  };

  const refetchAllSpreadsheets = () => {
    if (!!props.datasourceId && !!props.pluginId) {
      fetchAllSpreadsheets({
        selectedDatasourceId: props.datasourceId,
        pluginId: props.pluginId || "",
        requestObject: {},
      });
      setSpreadsheetOptions([]);
      setSheetOptions([]);
      setSheetData(undefined);
      setSelectedSpreadsheet((ss) => {
        setSelectedSheet((s) => {
          collapseAccordions(datasource?.id || "", ss.value, s.value);

          return {};
        });

        return {};
      });
    }
  };

  // Fetch spreadsheets if datasourceId present
  useEffect(() => {
    fetchAllSpreadsheets({
      selectedDatasourceId: props.datasourceId,
      pluginId: props.pluginId || "",
      requestObject: {},
    });
  }, [props.datasourceId, props.pluginId, dispatch]);

  // Set first spreadsheet as default option in the dropdown
  useEffect(() => {
    if (spreadsheetOptions?.length > 0 && isEmpty(selectedSpreadsheet.value)) {
      selectSpreadsheetAndToggle(spreadsheetOptions[0]);
    }
  }, [selectedSpreadsheet, spreadsheetOptions]);

  // Set first sheet as default option in the dropdown
  useEffect(() => {
    if (
      sheetOptions?.length > 0 &&
      isEmpty(selectedSheet.value) &&
      !isFetchingSheetsList &&
      !isFetchingSpreadsheets
    ) {
      selectSheetAndToggle(sheetOptions[0]);
    }
  }, [
    selectedSheet,
    sheetOptions,
    isFetchingSheetsList,
    isFetchingSpreadsheets,
  ]);

  useEffect(() => {
    toggleOnUnmountRefObject.current.selectedSpreadSheet =
      selectedSpreadsheet.value;
    toggleOnUnmountRefObject.current.selectedSheet = selectedSheet.value;
  }, [selectedSpreadsheet, selectedSheet]);

  useEffect(() => {
    return () => {
      collapseAccordions(
        datasource?.id || "",
        toggleOnUnmountRefObject.current.selectedSpreadSheet,
        toggleOnUnmountRefObject.current.selectedSheet,
      );
    };
  }, [datasource?.id]);

  const onSelectSpreadsheet = (
    table: string | undefined,
    tableObj: DropdownOption | undefined,
  ) => {
    if (table && tableObj) {
      AnalyticsUtil.logEvent("GSHEET_PREVIEW_SPREADSHEET_CHANGE", {
        datasourceId: props.datasourceId,
        pluginId: props.pluginId,
      });
      selectSpreadsheetAndToggle(tableObj);
    }
  };

  const onSelectSheetOption = (
    sheetValue: string | undefined,
    sheetObj: DropdownOption | undefined,
  ) => {
    if (sheetValue && sheetObj) {
      AnalyticsUtil.logEvent("GSHEET_PREVIEW_SHEET_CHANGE", {
        datasourceId: props.datasourceId,
        pluginId: props.pluginId,
      });
      selectSheetAndToggle(sheetObj);
    }
  };

  const isError =
    selectedDatasourceIsInvalid ||
    failedFetchingSheetsList ||
    failedFetchingSheetData;
  const isLoading =
    isFetchingSpreadsheets || isFetchingSheetsList || isFetchingSheetData;

  const refreshSpreadSheetButton = (option: DropdownOption) => (
    <Button
      isIconButton
      kind="tertiary"
      onClick={() => selectSpreadsheetAndToggle(option)}
      startIcon="refresh"
    />
  );

  const filteredSpreadsheets = spreadsheetOptions.filter((option) =>
    (option.label || "").toLowerCase()?.includes(searchString),
  );

  return (
    <ViewModeSchemaContainer>
      <DataWrapperContainer>
        <StructureContainer data-testid="t--datasource-schema-container">
          {datasource && (
            <DatasourceStructureHeader
              datasource={datasource}
              paddingBottom
              refetchFn={refetchAllSpreadsheets}
            />
          )}
          <DatasourceListContainer className="t--gsheet-structure">
            {!isFetchingSpreadsheets && (
              <DatasourceStructureSearchContainer className="t--gsheet-search-container">
                <SearchInput
                  className="datasourceStructure-search"
                  endIcon="close"
                  onChange={(value: string) => handleSearch(value)}
                  placeholder={createMessage(GSHEET_SEARCH_PLACEHOLDER)}
                  size={"sm"}
                  startIcon="search"
                  //@ts-expect-error Fix this the next time the file is edited
                  type="text"
                />
              </DatasourceStructureSearchContainer>
            )}
            <div className="t--gsheet-structure-list">
              {isFetchingSpreadsheets ? (
                <ItemLoadingIndicator type="SPREADSHEET" />
              ) : (
                filteredSpreadsheets.map((spreadsheet) => {
                  return (
                    <Entity
                      className="t--spreadsheet-structure"
                      customAddButton={refreshSpreadSheetButton(spreadsheet)}
                      entityId={`${datasource?.id}-${spreadsheet.value}`}
                      icon={null}
                      key={`${datasource?.id}-${spreadsheet.value}`}
                      name={spreadsheet.label as string}
                      onToggle={(isOpen) => {
                        isOpen &&
                          onSelectSpreadsheet(spreadsheet.value, spreadsheet);
                      }}
                      showAddButton={
                        spreadsheet.value === selectedSpreadsheet.value
                      }
                      step={0}
                    >
                      {isFetchingSheetsList ? (
                        <ItemLoadingIndicator type="SHEET" />
                      ) : sheetOptions.length > 0 ? (
                        sheetOptions.map((sheet) => (
                          <Entity
                            className={`t--sheet-structure ${
                              spreadsheet.value === selectedSpreadsheet.value &&
                              sheet.value === selectedSheet.value
                                ? "t--sheet-structure-active"
                                : ""
                            }`}
                            entityId={`${datasource?.id}-${selectedSpreadsheet.value}-${sheet.value}`}
                            icon={null}
                            key={`${datasource?.id}-${selectedSpreadsheet.value}-${sheet.value}`}
                            name={sheet.label as string}
                            onToggle={(isOpen) => {
                              isOpen && onSelectSheetOption(sheet.value, sheet);
                            }}
                            step={1}
                          >
                            {selectedSheet.value === sheet.value ? (
                              isFetchingSheetData ? (
                                <ItemLoadingIndicator type="DATA" />
                              ) : sheetData?.length > 0 ? (
                                <DatasourceAttributesWrapper>
                                  {Object.keys(sheetData[0]).map(
                                    (fieldValue, index) => (
                                      <DatasourceField
                                        field={{
                                          name: fieldValue,
                                          type: "string",
                                        }}
                                        key={`${fieldValue}${index}`}
                                        step={2}
                                      />
                                    ),
                                  )}
                                </DatasourceAttributesWrapper>
                              ) : null
                            ) : (
                              <ItemLoadingIndicator type="DATA" />
                            )}
                          </Entity>
                        ))
                      ) : (
                        <ItemLoadingIndicator type="SPREADSHEET" />
                      )}
                    </Entity>
                  );
                })
              )}
            </div>
          </DatasourceListContainer>
        </StructureContainer>
        <DatasourceDataContainer>
          <TableWrapper>
            {isLoading ? (
              <RenderInterimDataState state="LOADING" />
            ) : isError ? (
              <RenderInterimDataState state="FAILED" />
            ) : sheetData?.length > 0 ? (
              <Table data={sheetData} shouldResize={false} />
            ) : (
              <RenderInterimDataState state="NODATA" />
            )}
          </TableWrapper>
        </DatasourceDataContainer>
      </DataWrapperContainer>
    </ViewModeSchemaContainer>
  );
}

export default GoogleSheetSchema;
