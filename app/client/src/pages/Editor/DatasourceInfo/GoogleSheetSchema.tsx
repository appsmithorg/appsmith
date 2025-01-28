import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { DropdownOption } from "@appsmith/ads-old";
import { Button, SearchInput } from "@appsmith/ads";
import {
  useSheetData,
  useSheetsList,
  useSpreadSheets,
} from "../GeneratePage/components/GeneratePageForm/hooks";
import type { DropdownOptions } from "../GeneratePage/components/constants";
import { DEFAULT_DROPDOWN_OPTION } from "../GeneratePage/components/constants";
import { isEmpty } from "lodash";
import Table from "PluginActionEditor/components/PluginActionResponse/components/Table";
import {
  getCurrentApplicationId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { generateTemplateToUpdatePage } from "actions/pageActions";
import {
  createMessage,
  DATASOURCE_GENERATE_PAGE_BUTTON,
  GSHEET_SEARCH_PLACEHOLDER,
} from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import type { AppState } from "ee/reducers";
import { getDatasource } from "ee/selectors/entitiesSelector";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getHasCreatePagePermission,
  hasCreateDSActionPermissionInApp,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import RenderInterimDataState from "./RenderInterimDataState";
import {
  ButtonContainer,
  DataWrapperContainer,
  DatasourceAttributesWrapper,
  DatasourceDataContainer,
  DatasourceListContainer,
  DatasourceStructureSearchContainer,
  StructureContainer,
  TableWrapper,
  ViewModeSchemaContainer,
} from "./SchemaViewModeCSS";
import DatasourceStructureHeader from "./DatasourceStructureHeader";
import Entity from "../Explorer/Entity";
import DatasourceField from "./DatasourceField";
import { setEntityCollapsibleState } from "actions/editorContextActions";
import ItemLoadingIndicator from "./ItemLoadingIndicator";
import history from "utils/history";
import { getIsGeneratingTemplatePage } from "selectors/pageListSelectors";
import { getIsAnvilEnabledInCurrentApplication } from "layoutSystems/anvil/integrations/selectors";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";

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

  const isAnvilEnabled = useSelector(getIsAnvilEnabledInCurrentApplication);

  const toggleOnUnmountRefObject = useRef<{
    selectedSheet?: string;
    selectedSpreadSheet?: string;
  }>({});

  const isGeneratePageLoading = useSelector(getIsGeneratingTemplatePage);

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

  const applicationId: string = useSelector(getCurrentApplicationId);
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

  const onGsheetGeneratePage = () => {
    const payload = {
      applicationId: applicationId || "",
      pageId: "",
      columns: sheetData?.length > 0 ? Object.keys(sheetData[0]) : [],
      searchColumn: "",
      tableName: selectedSheet?.value || "",
      datasourceId: props.datasourceId || "",
      pluginSpecificParams: {
        sheetName: selectedSheet?.value || "",
        sheetUrl: selectedSpreadsheet?.value || "",
        tableHeaderIndex: 1,
      },
    };

    AnalyticsUtil.logEvent("GSHEET_GENERATE_PAGE_BUTTON_CLICKED", {
      datasourceId: props.datasourceId,
      pluginId: props.pluginId,
    });

    dispatch(generateTemplateToUpdatePage(payload));
  };

  const pagePermissions = useSelector(getPagePermissions);
  const datasourcePermissions = datasource?.userPermissions || [];

  const userAppPermissions = useSelector(
    (state: AppState) => getCurrentApplication(state)?.userPermissions ?? [],
  );

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const releaseDragDropBuildingBlocks = useFeatureFlag(
    FEATURE_FLAG.release_drag_drop_building_blocks_enabled,
  );

  const ideType = getIDETypeByUrl(history.location.pathname);

  const canCreatePages = getHasCreatePagePermission(
    isFeatureEnabled,
    userAppPermissions,
  );

  const canCreateDatasourceActions = hasCreateDSActionPermissionInApp({
    isEnabled: isFeatureEnabled,
    dsPermissions: datasourcePermissions,
    pagePermissions,
    ideType,
  });

  const refreshSpreadSheetButton = (option: DropdownOption) => (
    <Button
      isIconButton
      kind="tertiary"
      onClick={() => selectSpreadsheetAndToggle(option)}
      startIcon="refresh"
    />
  );

  const showGeneratePageBtn =
    !releaseDragDropBuildingBlocks &&
    !isLoading &&
    !isError &&
    sheetData?.length &&
    canCreateDatasourceActions &&
    canCreatePages &&
    !isAnvilEnabled;

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
      {showGeneratePageBtn && (
        <ButtonContainer>
          <Button
            className="t--datasource-generate-page"
            isLoading={isGeneratePageLoading}
            key="datasource-generate-page"
            kind="primary"
            onClick={onGsheetGeneratePage}
            size="md"
          >
            {createMessage(DATASOURCE_GENERATE_PAGE_BUTTON)}
          </Button>
        </ButtonContainer>
      )}
    </ViewModeSchemaContainer>
  );
}

export default GoogleSheetSchema;
