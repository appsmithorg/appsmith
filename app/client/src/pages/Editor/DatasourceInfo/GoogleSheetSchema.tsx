import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { DropdownOption } from "design-system-old";
import { Button, Spinner, Text } from "design-system";
import {
  useSheetData,
  useSheetsList,
  useSpreadSheets,
} from "../GeneratePage/components/GeneratePageForm/hooks";
import type { DropdownOptions } from "../GeneratePage/components/constants";
import { DEFAULT_DROPDOWN_OPTION } from "../GeneratePage/components/constants";
import { isEmpty } from "lodash";
import Table from "pages/Editor/QueryEditor/Table";
import {
  getCurrentApplicationId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { generateTemplateToUpdatePage } from "actions/pageActions";
import {
  createMessage,
  DATASOURCE_GENERATE_PAGE_BUTTON,
  GSHEET_DATA_LOADING,
  GSHEET_SHEET_LOADING,
  GSHEET_SPREADSHEET_LOADING,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentApplication } from "@appsmith/selectors/applicationSelectors";
import type { AppState } from "@appsmith/reducers";
import { getDatasource } from "@appsmith/selectors/entitiesSelector";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  getHasCreatePagePermission,
  hasCreateDSActionPermissionInApp,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import RenderInterimDataState from "./RenderInterimDataState";
import {
  ButtonContainer,
  DataWrapperContainer,
  DatasourceAttributesWrapper,
  DatasourceDataContainer,
  DatasourceListContainer,
  MessageWrapper,
  StructureContainer,
  TableWrapper,
  ViewModeSchemaContainer,
} from "./SchemaViewModeCSS";
import DatasourceStructureHeader from "./DatasourceStructureHeader";
import Entity from "../Explorer/Entity";
import DatasourceField from "./DatasourceField";
import { setEntityCollapsibleState } from "actions/editorContextActions";

interface Props {
  datasourceId: string;
  pluginId?: string;
}

const MAX_SHEET_ROWS_LENGTH = 12;

type LoadingItemType = "SPREADSHEET" | "SHEET" | "DATA";

const LoadingItemIndicator = ({ type }: { type: LoadingItemType }) => {
  return (
    <MessageWrapper className="t--gsheet-loading-indicator">
      <Spinner size="md" />
      <Text style={{ marginLeft: "8px" }}>
        {createMessage(
          type === "SPREADSHEET"
            ? GSHEET_SPREADSHEET_LOADING
            : type === "SHEET"
            ? GSHEET_SHEET_LOADING
            : GSHEET_DATA_LOADING,
        )}
      </Text>
    </MessageWrapper>
  );
};

// ---------- GoogleSheetSchema Component -------

function GoogleSheetSchema(props: Props) {
  const [spreadsheetOptions, setSpreadsheetOptions] = useState<DropdownOptions>(
    [],
  );
  const [selectedDatasourceIsInvalid, setSelectedDatasourceIsInvalid] =
    useState(false);
  const { fetchAllSpreadsheets, isFetchingSpreadsheets } = useSpreadSheets({
    setSelectedDatasourceTableOptions: setSpreadsheetOptions,
    setSelectedDatasourceIsInvalid,
  });
  const {
    failedFetchingSheetsList,
    fetchSheetsList,
    isFetchingSheetsList,
    sheetsList,
  } = useSheetsList();
  const { fetchSheetData, isFetchingSheetData, sheetData } = useSheetData();
  const [selectedSpreadsheet, setSelectedSpreadsheet] =
    useState<DropdownOption>({});
  const [selectedSheet, setSelectedSheet] = useState<DropdownOption>({});
  const [currentSheetData, setCurrentSheetData] = useState<any>();
  const applicationId: string = useSelector(getCurrentApplicationId);
  const datasource = useSelector((state) =>
    getDatasource(state, props.datasourceId),
  );

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
      setCurrentSheetData(undefined);
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
      setCurrentSheetData(undefined);
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

  const selectSpreadsheetAndToggle = (option: DropdownOption) => {
    if (!isEmpty(selectedSpreadsheet.value) && !isEmpty(selectedSheet.value)) {
      dispatch(
        setEntityCollapsibleState(
          `${datasource?.id}-${selectedSpreadsheet.value}-${selectedSheet.value}`,
          false,
        ),
      );
    }
    if (!isEmpty(selectedSpreadsheet.value)) {
      dispatch(
        setEntityCollapsibleState(
          `${datasource?.id}-${selectedSpreadsheet.value}`,
          false,
        ),
      );
    }
    setSelectedSpreadsheet(option);
    dispatch(
      setEntityCollapsibleState(`${datasource?.id}-${option.value}`, true),
    );
    scrollIntoView(
      `#${CSS.escape(`entity-${datasource?.id}-${option.value}`)}`,
      ".t--gsheet-structure",
    );
  };

  const selectSheetAndToggle = (option: DropdownOption) => {
    if (!isEmpty(selectedSpreadsheet.value) && !isEmpty(selectedSheet.value)) {
      dispatch(
        setEntityCollapsibleState(
          `${datasource?.id}-${selectedSpreadsheet.value}-${selectedSheet.value}`,
          false,
        ),
      );
    }
    setSelectedSheet(option);
    dispatch(
      setEntityCollapsibleState(
        `${datasource?.id}-${selectedSpreadsheet.value}-${option.value}`,
        true,
      ),
    );
    setTimeout(() => {
      scrollIntoView(
        `#${CSS.escape(
          `entity-${datasource?.id}-${selectedSpreadsheet.value}-${option.value}`,
        )}`,
        ".t--gsheet-structure",
        -30,
      );
    }, 0);
  };

  // Set first spreadsheet as default option in the dropdown
  useEffect(() => {
    if (spreadsheetOptions?.length > 0 && isEmpty(selectedSpreadsheet.value)) {
      selectSpreadsheetAndToggle(spreadsheetOptions[0]);
    }
  }, [selectedSpreadsheet, spreadsheetOptions]);

  // Set first sheet as default option in the dropdown
  useEffect(() => {
    if (
      sheetsList?.length > 0 &&
      isEmpty(selectedSheet.value) &&
      !isFetchingSheetsList
    ) {
      selectSheetAndToggle(sheetsList[0]);
    }
  }, [selectedSheet, sheetsList, isFetchingSheetsList]);

  // Set current sheet data
  useEffect(() => {
    if (sheetData) {
      // Getting the top 12 rows as for experimentation we need to keep this number fixed for preview
      AnalyticsUtil.logEvent("GSHEET_PREVIEW_DATA_SHOWN", {
        datasourceId: props.datasourceId,
        pluginId: props.pluginId,
      });
      setCurrentSheetData(sheetData.slice(0, MAX_SHEET_ROWS_LENGTH));
    }
  }, [sheetData]);

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

  const isError = selectedDatasourceIsInvalid || failedFetchingSheetsList;
  const isLoading =
    isFetchingSpreadsheets ||
    isFetchingSheetsList ||
    isFetchingSheetData ||
    (!isError && !currentSheetData);

  const onGsheetGeneratePage = () => {
    const payload = {
      applicationId: applicationId || "",
      pageId: "",
      columns:
        !!currentSheetData && currentSheetData.length > 0
          ? Object.keys(currentSheetData[0])
          : [],
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

  const canCreatePages = getHasCreatePagePermission(
    isFeatureEnabled,
    userAppPermissions,
  );

  const canCreateDatasourceActions = hasCreateDSActionPermissionInApp(
    isFeatureEnabled,
    datasourcePermissions,
    pagePermissions,
  );

  const showGeneratePageBtn =
    !isLoading &&
    !isError &&
    currentSheetData &&
    canCreateDatasourceActions &&
    canCreatePages;

  return (
    <ViewModeSchemaContainer>
      <DataWrapperContainer>
        <StructureContainer>
          {datasource && (
            <DatasourceStructureHeader datasource={datasource} paddingBottom />
          )}
          <DatasourceListContainer className="t--gsheet-structure">
            {isFetchingSpreadsheets ? (
              <LoadingItemIndicator type="SPREADSHEET" />
            ) : (
              spreadsheetOptions.map((spreadsheet) => {
                return (
                  <Entity
                    className="t--spreadsheet-structure"
                    entityId={`${datasource?.id}-${spreadsheet.value}`}
                    icon={null}
                    key={`${datasource?.id}-${spreadsheet.value}`}
                    name={spreadsheet.label as string}
                    onToggle={(isOpen) => {
                      isOpen &&
                        onSelectSpreadsheet(spreadsheet.value, spreadsheet);
                    }}
                    step={0}
                  >
                    {isFetchingSheetsList ? (
                      <LoadingItemIndicator type="SHEET" />
                    ) : sheetsList.length > 0 ? (
                      sheetsList.map((sheet) => (
                        <Entity
                          className={`t--sheet-structure ${
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
                              <LoadingItemIndicator type="DATA" />
                            ) : currentSheetData?.length > 0 ? (
                              <DatasourceAttributesWrapper>
                                {Object.keys(currentSheetData[0]).map(
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
                            <LoadingItemIndicator type="DATA" />
                          )}
                        </Entity>
                      ))
                    ) : (
                      <LoadingItemIndicator type="SPREADSHEET" />
                    )}
                  </Entity>
                );
              })
            )}
          </DatasourceListContainer>
        </StructureContainer>
        <DatasourceDataContainer>
          <TableWrapper>
            {isLoading ? (
              <RenderInterimDataState state="LOADING" />
            ) : isError ? (
              <RenderInterimDataState state="FAILED" />
            ) : currentSheetData?.length > 0 ? (
              <Table data={currentSheetData} />
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
            isDisabled={!currentSheetData || currentSheetData?.length == 0}
            key="datasource-generate-page"
            kind="secondary"
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
