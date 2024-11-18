import React, { useEffect, useState, useCallback, useRef } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import {
  getDatasources,
  getIsFetchingDatasourceStructure,
  getGenerateCRUDEnabledPluginMap,
  getIsFetchingSinglePluginForm,
  getDatasourcesStructure,
  getNumberOfEntitiesInCurrentPage,
} from "ee/selectors/entitiesSelector";

import type { Datasource } from "entities/Datasource";
import {
  fetchDatasourceStructure,
  setDatasourceViewModeFlag,
} from "actions/datasourceActions";
import { generateTemplateToUpdatePage } from "actions/pageActions";
import { INTEGRATION_TABS } from "constants/routes";
import history from "utils/history";
import {
  getGeneratePageModalParams,
  getIsGeneratingTemplatePage,
} from "selectors/pageListSelectors";
import DataSourceOption, {
  CONNECT_NEW_DATASOURCE_OPTION_ID,
  DatasourceImage,
} from "../DataSourceOption";
import type { DropdownOption } from "@appsmith/ads-old";
import { Button, Icon, Text, Select, Option, Tooltip } from "@appsmith/ads";
import GoogleSheetForm from "./GoogleSheetForm";
import {
  createMessage,
  GEN_CRUD_DATASOURCE_DROPDOWN_LABEL,
} from "ee/constants/messages";
import type { GenerateCRUDEnabledPluginMap } from "api/PluginApi";
import {
  useDatasourceOptions,
  useSheetsList,
  useSpreadSheets,
  useSheetColumnHeaders,
  useS3BucketList,
} from "./hooks";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { AppState } from "ee/reducers";
import type {
  DropdownOptions,
  DatasourceTableDropdownOption,
} from "../constants";
import {
  PluginFormInputFieldMap,
  DEFAULT_DROPDOWN_OPTION,
  DROPDOWN_DIMENSION,
  ALLOWED_SEARCH_DATATYPE,
} from "../constants";
import { Bold, Label, SelectWrapper } from "./styles";
import type { GeneratePagePayload } from "./types";
import {
  getCurrentApplicationId,
  getCurrentBasePageId,
  getCurrentPageId,
} from "selectors/editorSelectors";

import { datasourcesEditorIdURL, integrationEditorURL } from "ee/RouteBuilder";
import { PluginPackageName } from "entities/Action";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { getPluginImages } from "ee/selectors/entitiesSelector";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import { isGoogleSheetPluginDS } from "utils/editorContextUtils";
import equal from "fast-deep-equal";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasCreateDatasourcePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { closeGeneratePageModal } from "../../store/generatePageActions";

//  ---------- Styles ----------

const TooltipWrapper = styled.div`
  margin-left: 6px;
`;

const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.p`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  white-space: nowrap;
  margin-bottom: 4px;
`;

const ErrorMsg = styled.span`
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: -0.221538px;
  color: var(--ads-v2-color-fg-error);
  margin-top: var(--ads-spaces-3);
`;

const HelperMsg = styled.span`
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: -0.221538px;
  color: var(--ads-v2-color-fg-muted);
  margin: 6px 0px 10px;
`;

const StyledIconWrapper = styled.div`
  height: 20px;
  width: auto;
  display: flex;
  align-items: center;
  margin: 0px 8px 0px 0px;
`;

const OptionWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;

  .datasource-sub-text {
    position: absolute;
    right: 4px;
    font-size: 12px;
  }
`;
// Constants

const datasourceIcon = "layout-5-line";
const columnIcon = "layout-column-line";

export const GENERATE_PAGE_MODE = {
  NEW: "NEW", // a new page is created for the template. (new pageId created)
  REPLACE_EMPTY: "REPLACE_EMPTY", // current page's content (DSL) is updated to template DSL. (same pageId)
};

function GeneratePageSubmitBtn({
  disabled,
  isLoading,
  onSubmit,
  showSubmitButton,
}: {
  onSubmit: () => void;
  isLoading: boolean;
  showSubmitButton: boolean;
  disabled: boolean;
}) {
  return showSubmitButton ? (
    <div>
      <Button
        data-testid="t--generate-page-form-submit"
        isDisabled={disabled}
        isLoading={isLoading}
        kind="primary"
        onClick={() => !disabled && onSubmit()}
        size="md"
      >
        Generate page
      </Button>
    </div>
  ) : null;
}

enum GeneratePageSelectedViewIconEnum {
  PLUGIN_ICON = "plugin-icon",
  ADS_ICON = "ads-icon",
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DatasourceOptionSelectedView = (props: any) => {
  const { iconType, option, pluginImages } = props;

  return (
    <OptionWrapper>
      <StyledIconWrapper>
        {props.iconType === GeneratePageSelectedViewIconEnum.PLUGIN_ICON && (
          <DatasourceImage
            alt=""
            className="dataSourceImage"
            src={getAssetUrl(
              pluginImages[(option as DropdownOption)?.data?.pluginId],
            )}
          />
        )}
        {iconType === GeneratePageSelectedViewIconEnum.ADS_ICON && (
          <Icon
            color={option?.iconColor}
            name={option.icon}
            size={option?.iconSize}
          />
        )}
      </StyledIconWrapper>
      <Text renderAs="p">{option.label} </Text>
    </OptionWrapper>
  );
};

// ---------- GeneratePageForm Component ----------

function GeneratePageForm() {
  const dispatch = useDispatch();
  const params = useSelector(getGeneratePageModalParams);

  const basePageId = useSelector(getCurrentBasePageId);
  const pageId = useSelector(getCurrentPageId);

  const pluginImages = useSelector(getPluginImages);

  const applicationId = useSelector(getCurrentApplicationId);
  const workspace = useSelector(getCurrentAppWorkspace);

  const datasources: Datasource[] = useSelector(getDatasources);
  const isGeneratingTemplatePage = useSelector(getIsGeneratingTemplatePage);
  const numberOfEntities = useSelector(getNumberOfEntitiesInCurrentPage);
  const currentMode = useRef(
    numberOfEntities > 0
      ? GENERATE_PAGE_MODE.NEW
      : GENERATE_PAGE_MODE.REPLACE_EMPTY,
  );

  const [datasourceIdToBeSelected, setDatasourceIdToBeSelected] =
    useState<string>("");
  const datasourcesStructure = useSelector(getDatasourcesStructure);

  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap = useSelector(
    getGenerateCRUDEnabledPluginMap,
  );

  const [datasourceTableOptions, setSelectedDatasourceTableOptions] =
    useState<DropdownOptions>([]);

  const [selectedTableColumnOptions, setSelectedTableColumnOptions] =
    useState<DropdownOptions>([]);

  const [selectedDatasource, selectDataSource] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );

  const isFetchingDatasourceStructure = useSelector((state: AppState) =>
    getIsFetchingDatasourceStructure(state, selectedDatasource.id || ""),
  );

  const [isSelectedTableEmpty, setIsSelectedTableEmpty] =
    useState<boolean>(false);

  const selectedDatasourcePluginId: string = selectedDatasource.data?.pluginId;
  const selectedDatasourcePluginPackageName: string =
    generateCRUDSupportedPlugin[selectedDatasourcePluginId];

  const isGoogleSheetPlugin = isGoogleSheetPluginDS(
    selectedDatasourcePluginPackageName,
  );

  const isS3Plugin =
    selectedDatasourcePluginPackageName === PluginPackageName.S3;

  const isFetchingSheetPluginForm = useSelector((state: AppState) => {
    if (isGoogleSheetPlugin) {
      return getIsFetchingSinglePluginForm(
        state,
        selectedDatasource.data?.pluginId,
      );
    }

    return false;
  });

  const [selectedTable, selectTable] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );

  const [selectedDatasourceIsInvalid, setSelectedDatasourceIsInvalid] =
    useState(false);

  const [selectedColumn, selectColumn] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );

  const { bucketList, failedFetchingBucketList, isFetchingBucketList } =
    useS3BucketList();

  const onSelectDataSource = useCallback(
    (
      datasource: string | undefined,
      dataSourceObj: DropdownOption | undefined,
    ) => {
      if (
        datasource &&
        dataSourceObj &&
        selectedDatasource.id !== dataSourceObj.id
      ) {
        const pluginId: string = dataSourceObj.data.pluginId;
        const pluginPackageName: string = generateCRUDSupportedPlugin[pluginId];

        AnalyticsUtil.logEvent("GEN_CRUD_PAGE_SELECT_DATASOURCE", {
          datasourceType: pluginPackageName,
        });
        selectDataSource(dataSourceObj);
        setSelectedDatasourceTableOptions([]);
        setSelectedTableColumnOptions([]);
        selectTable(DEFAULT_DROPDOWN_OPTION);
        selectColumn(DEFAULT_DROPDOWN_OPTION);
        setSelectedDatasourceIsInvalid(false);

        if (dataSourceObj.id) {
          switch (pluginPackageName) {
            case PluginPackageName.GOOGLE_SHEETS:
              break;
            default: {
              if (dataSourceObj.id) {
                dispatch(fetchDatasourceStructure(dataSourceObj.id, true));
              }
            }
          }
        }
      }
    },
    [
      generateCRUDSupportedPlugin,
      selectDataSource,
      setSelectedDatasourceTableOptions,
      setSelectedTableColumnOptions,
      selectTable,
      selectColumn,
      dispatch,
      setSelectedDatasourceIsInvalid,
      selectedDatasource,
      generateCRUDSupportedPlugin,
    ],
  );

  const onSelectTable = useCallback(
    (
      table: string | undefined,
      TableObj: DatasourceTableDropdownOption | undefined,
    ) => {
      if (table && TableObj) {
        AnalyticsUtil.logEvent("GEN_CRUD_PAGE_SELECT_TABLE");
        selectTable(TableObj);
        selectColumn(DEFAULT_DROPDOWN_OPTION);

        if (!isGoogleSheetPlugin && !isS3Plugin) {
          const { data } = TableObj;

          if (Array.isArray(data.columns)) {
            if (data.columns.length === 0) setIsSelectedTableEmpty(true);
            else {
              if (isSelectedTableEmpty) setIsSelectedTableEmpty(false);

              const newSelectedTableColumnOptions: DropdownOption[] = [];

              data.columns.map((column) => {
                if (
                  column.type &&
                  ALLOWED_SEARCH_DATATYPE.includes(column.type.toLowerCase())
                ) {
                  newSelectedTableColumnOptions.push({
                    id: column.name,
                    label: column.name,
                    value: column.name,
                    subText: column.type,
                    icon: columnIcon,
                    iconSize: "md",
                    iconColor: "var(--ads-v2-color-fg)",
                  });
                }
              });
              setSelectedTableColumnOptions(newSelectedTableColumnOptions);
            }
          } else {
            setSelectedTableColumnOptions([]);
          }
        }
      }
    },
    [
      isSelectedTableEmpty,
      selectTable,
      setSelectedTableColumnOptions,
      selectColumn,
      setIsSelectedTableEmpty,
      isGoogleSheetPlugin,
      isS3Plugin,
    ],
  );

  const onSelectColumn = useCallback(
    (table: string | undefined, ColumnObj: DropdownOption | undefined) => {
      if (table && ColumnObj) {
        AnalyticsUtil.logEvent("GEN_CRUD_PAGE_SELECT_SEARCH_COLUMN");
        selectColumn(ColumnObj);
      }
    },
    [selectColumn],
  );

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateDatasource = getHasCreateDatasourcePermission(
    isFeatureEnabled,
    workspace?.userPermissions || [],
  );

  const spreadSheetsProps = useSpreadSheets({
    setSelectedDatasourceTableOptions,
    setSelectedDatasourceIsInvalid,
  });

  // Flag to indicate fetching of datasource configs or structure
  const fetchingDatasourceConfigs =
    isFetchingDatasourceStructure ||
    (isFetchingBucketList && isS3Plugin) ||
    ((isFetchingSheetPluginForm || spreadSheetsProps.isFetchingSpreadsheets) &&
      isGoogleSheetPlugin);

  // Options for datasource dropdown
  const dataSourceOptions = useDatasourceOptions({
    canCreateDatasource,
    datasources,
    generateCRUDSupportedPlugin,
    fetchingDatasourceConfigs,
  });

  const sheetsListProps = useSheetsList();

  const sheetColumnsHeaderProps = useSheetColumnHeaders();

  useEffect(() => {
    if (isS3Plugin && bucketList && bucketList.length) {
      const tables = bucketList.map((bucketName) => ({
        id: bucketName,
        label: bucketName,
        value: bucketName,
        icon: datasourceIcon,
        iconSize: "md",
        iconColor: "var(--ads-v2-color-fg)",
      }));

      setSelectedDatasourceTableOptions(tables as DropdownOptions);
    }
  }, [bucketList, isS3Plugin, setSelectedDatasourceTableOptions]);

  useEffect(() => {
    if (
      selectedDatasource.id &&
      selectedDatasource.value &&
      !isFetchingDatasourceStructure
    ) {
      // when finished fetching datasource structure
      const selectedDatasourceStructure =
        datasourcesStructure[selectedDatasource.id] || {};

      const hasError = selectedDatasourceStructure?.error;

      if (hasError) {
        setSelectedDatasourceIsInvalid(true);
      } else {
        setSelectedDatasourceIsInvalid(false);
        const tables = selectedDatasourceStructure?.tables;

        if (tables) {
          const newTables = tables.map(({ columns, name }) => ({
            id: name,
            label: name,
            value: name,
            icon: datasourceIcon,
            iconSize: "md",
            iconColor: "var(--ads-v2-color-fg)",
            data: {
              columns,
            },
          }));

          setSelectedDatasourceTableOptions(newTables as DropdownOptions);
        }
      }
    }
  }, [
    datasourcesStructure,
    selectedDatasource,
    isFetchingDatasourceStructure,
    setSelectedDatasourceIsInvalid,
    setSelectedDatasourceTableOptions,
  ]);

  useEffect(() => {
    // If there is any datasource id passed in queryParams which needs to be selected
    if (datasourceIdToBeSelected) {
      if (selectedDatasource.id !== datasourceIdToBeSelected) {
        for (let i = 0; i < dataSourceOptions.length; i++) {
          if (dataSourceOptions[i].id === datasourceIdToBeSelected) {
            onSelectDataSource(
              dataSourceOptions[i].value,
              dataSourceOptions[i],
            );
            setDatasourceIdToBeSelected("");
            break;
          }
        }
      }
    }

    // The datasourceOptions can be update in case the environments are refreshed, need to sync the
    // selected datasource with the updated datasourceOptions
    for (let i = 0; i < dataSourceOptions.length; i++) {
      if (dataSourceOptions[i].id === selectedDatasource.id) {
        if (!equal(dataSourceOptions[i], selectedDatasource))
          selectDataSource(dataSourceOptions[i]);

        break;
      }
    }
  }, [
    dataSourceOptions,
    datasourceIdToBeSelected,
    onSelectDataSource,
    selectedDatasource,
    setDatasourceIdToBeSelected,
    selectDataSource,
  ]);

  useEffect(() => {
    if (params?.datasourceId || params?.new_page) {
      const datasourceId = params.datasourceId;
      const generateNewPage = params.new_page;

      if (datasourceId) {
        if (generateNewPage || numberOfEntities > 0) {
          currentMode.current = GENERATE_PAGE_MODE.NEW;
        } else {
          currentMode.current = GENERATE_PAGE_MODE.REPLACE_EMPTY;
        }

        setDatasourceIdToBeSelected(datasourceId);
      }
    }
  }, [numberOfEntities, params, setDatasourceIdToBeSelected]);

  const routeToCreateNewDatasource = () => {
    AnalyticsUtil.logEvent("GEN_CRUD_PAGE_CREATE_NEW_DATASOURCE");
    history.push(
      integrationEditorURL({
        basePageId,
        selectedTab: INTEGRATION_TABS.NEW,
        params: { isGeneratePageMode: "generate-page" },
      }),
    );
    // Event for datasource creation click
    const entryPoint = DatasourceCreateEntryPoints.GENERATE_CRUD;

    AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
      entryPoint,
    });
    dispatch(closeGeneratePageModal());
  };

  const generatePageAction = (data: GeneratePagePayload) => {
    let extraParams = {};

    if (data.pluginSpecificParams) {
      extraParams = {
        pluginSpecificParams: data.pluginSpecificParams,
      };
    }

    const payload = {
      applicationId: applicationId || "",
      pageId:
        currentMode.current === GENERATE_PAGE_MODE.NEW ? "" : pageId || "",
      columns: data.columns || [],
      searchColumn: data.searchColumn,
      tableName: data.tableName,
      datasourceId: selectedDatasource.id || "",
      mode: currentMode.current,
      ...extraParams,
    };

    AnalyticsUtil.logEvent("GEN_CRUD_PAGE_FORM_SUBMIT");
    dispatch(generateTemplateToUpdatePage(payload));
  };

  const handleFormSubmit = () => {
    const payload = {
      columns: [],
      searchColumn: selectedColumn.value,
      tableName: selectedTable.value || "",
    };

    generatePageAction(payload);
    dispatch(closeGeneratePageModal());
  };

  const goToEditDatasource = () => {
    AnalyticsUtil.logEvent("GEN_CRUD_PAGE_EDIT_DATASOURCE_CONFIG", {
      datasourceId: selectedDatasource.id,
    });
    const redirectURL = datasourcesEditorIdURL({
      basePageId,
      datasourceId: selectedDatasource.id as string,
      params: { isGeneratePageMode: "generate-page" },
    });

    history.push(redirectURL);
    dispatch(setDatasourceViewModeFlag(false));
    dispatch(closeGeneratePageModal());
  };

  // if the datasource has basic information to connect to db it is considered as a valid structure hence isValid true.
  const isValidDatasourceConfig = selectedDatasource.data?.isValid;

  const pluginField: {
    TABLE: string;
    COLUMN: string;
  } =
    selectedDatasourcePluginPackageName &&
    PluginFormInputFieldMap[selectedDatasourcePluginPackageName]
      ? PluginFormInputFieldMap[selectedDatasourcePluginPackageName]
      : PluginFormInputFieldMap.DEFAULT;

  let tableDropdownErrorMsg = "";

  const fetchingDatasourceConfigError =
    selectedDatasourceIsInvalid ||
    !isValidDatasourceConfig ||
    (failedFetchingBucketList && isS3Plugin);

  if (!fetchingDatasourceConfigs) {
    if (datasourceTableOptions.length === 0) {
      tableDropdownErrorMsg = `Couldn't find any ${pluginField.TABLE}, Please select another datasource`;
    }

    if (fetchingDatasourceConfigError) {
      tableDropdownErrorMsg = `Failed fetching datasource structure, Please check your datasource configuration`;
    }

    if (isSelectedTableEmpty) {
      tableDropdownErrorMsg = `Couldn't find any columns, Please select table with columns.`;
    }
  }

  const showEditDatasourceBtn =
    !isFetchingDatasourceStructure &&
    (selectedDatasourceIsInvalid || !isValidDatasourceConfig) &&
    !!selectedDatasource.value;

  const showSearchableColumn =
    !!selectedTable.value &&
    !fetchingDatasourceConfigs &&
    !fetchingDatasourceConfigError &&
    PluginPackageName.S3 !== selectedDatasourcePluginPackageName;

  const showSubmitButton =
    selectedTable.value &&
    !showEditDatasourceBtn &&
    !fetchingDatasourceConfigs &&
    !fetchingDatasourceConfigError &&
    !!selectedDatasource.value;

  const submitButtonDisable =
    !selectedTable.value || !showSubmitButton || isSelectedTableEmpty;

  return (
    <FormWrapper>
      <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
        <Label>{createMessage(GEN_CRUD_DATASOURCE_DROPDOWN_LABEL)}</Label>
        <Select
          data-testid="t--datasource-dropdown"
          getPopupContainer={(triggerNode) => triggerNode.parentNode.parentNode}
          onChange={(value) => {
            if (value === CONNECT_NEW_DATASOURCE_OPTION_ID) {
              routeToCreateNewDatasource();
            } else {
              onSelectDataSource(
                value,
                dataSourceOptions.find((ds) => ds.value === value),
              );
            }
          }}
          style={{ width: DROPDOWN_DIMENSION.WIDTH }}
          value={
            selectedDatasource?.label !== DEFAULT_DROPDOWN_OPTION?.label
              ? {
                  key: selectedDatasource?.value,
                  label: (
                    <DatasourceOptionSelectedView
                      iconType={GeneratePageSelectedViewIconEnum.PLUGIN_ICON}
                      option={selectedDatasource}
                      pluginImages={pluginImages}
                    />
                  ),
                }
              : selectedDatasource
          }
          // TODO: This needs to be fixed. Removed for cypress tests to pass
          virtual={false}
        >
          {dataSourceOptions.map((option) => {
            const isConnectNewDataSourceBtn =
              CONNECT_NEW_DATASOURCE_OPTION_ID ===
              (option as DropdownOption).id;
            const isSupportedForTemplate = (option as DropdownOption)?.data
              ?.isSupportedForTemplate;
            const isNotSupportedDatasource =
              !isSupportedForTemplate && !isConnectNewDataSourceBtn;

            return (
              <Option
                disabled={isNotSupportedDatasource}
                key={option.value}
                value={option.value}
              >
                <DataSourceOption
                  dataTestid="t--datasource-dropdown-option"
                  extraProps={{ routeToCreateNewDatasource }}
                  key={(option as DropdownOption).id}
                  option={option}
                  optionWidth={DROPDOWN_DIMENSION.WIDTH}
                />
              </Option>
            );
          })}
        </Select>
      </SelectWrapper>
      {selectedDatasource.value ? (
        <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
          <Label>
            Select {pluginField.TABLE} from&nbsp;
            <Bold>{selectedDatasource.label}</Bold>
          </Label>

          <Select
            data-testid="t--table-dropdown"
            getPopupContainer={(triggerNode) =>
              triggerNode.parentNode.parentNode
            }
            isDisabled={!!tableDropdownErrorMsg}
            isLoading={fetchingDatasourceConfigs}
            isValid={!tableDropdownErrorMsg}
            onChange={(value) =>
              onSelectTable(
                value,
                datasourceTableOptions.find(
                  (table) => table.value === value,
                ) as DatasourceTableDropdownOption,
              )
            }
            value={
              selectedTable?.label !== DEFAULT_DROPDOWN_OPTION?.label
                ? {
                    key: selectedTable?.value,
                    label: (
                      <DatasourceOptionSelectedView
                        iconType={GeneratePageSelectedViewIconEnum.ADS_ICON}
                        option={selectedTable}
                      />
                    ),
                  }
                : selectedTable
            }
            // TODO: This needs to be fixed. Removed for cypress tests to pass
            virtual={false}
          >
            {datasourceTableOptions.map((table) => {
              return (
                <Option key={table.value} value={table.value}>
                  <OptionWrapper>
                    <StyledIconWrapper>
                      <Icon
                        color={table?.iconColor}
                        name={table.icon as string}
                        size={table.iconSize}
                      />
                    </StyledIconWrapper>
                    <Text renderAs="p">{table.label}</Text>
                  </OptionWrapper>
                </Option>
              );
            })}
          </Select>
          {tableDropdownErrorMsg && (
            <ErrorMsg className="ads-dropdown-errorMsg">
              {tableDropdownErrorMsg}
            </ErrorMsg>
          )}
        </SelectWrapper>
      ) : null}
      {showEditDatasourceBtn && (
        <div>
          <Button kind="primary" onClick={goToEditDatasource} size="md">
            Edit datasource
          </Button>
        </div>
      )}
      {!isGoogleSheetPlugin ? (
        <>
          {showSearchableColumn && (
            <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
              <Row>
                Select a searchable {pluginField.COLUMN} from the selected&nbsp;
                {pluginField.TABLE}
                <TooltipWrapper>
                  <Tooltip content="Only string values are allowed for searchable column">
                    <Icon name="question-line" size="md" />
                  </Tooltip>
                </TooltipWrapper>
              </Row>
              <Select
                data-testid="t--table-dropdown"
                getPopupContainer={(triggerNode) =>
                  triggerNode.parentNode.parentNode
                }
                isDisabled={selectedTableColumnOptions.length === 0}
                onChange={(value) =>
                  onSelectColumn(
                    value,
                    selectedTableColumnOptions.find(
                      (column) => column.value === value,
                    ),
                  )
                }
                value={
                  selectedColumn?.label !== DEFAULT_DROPDOWN_OPTION?.label
                    ? {
                        key: selectedColumn?.value,
                        label: (
                          <DatasourceOptionSelectedView
                            iconType={GeneratePageSelectedViewIconEnum.ADS_ICON}
                            option={selectedColumn}
                          />
                        ),
                      }
                    : selectedColumn
                }
                virtual={false}
              >
                {selectedTableColumnOptions.map((column) => {
                  return (
                    <Option key={column.value} value={column.value}>
                      <OptionWrapper>
                        <StyledIconWrapper>
                          <Icon
                            color={column?.iconColor}
                            name={column.icon as string}
                            size={column.iconSize}
                          />
                        </StyledIconWrapper>
                        <Text renderAs="p">{column.label}</Text>
                        <Text
                          className="datasource-sub-text"
                          color="var(--ads-v2-color-fg-muted)"
                          renderAs="span"
                        >
                          {column.subText}
                        </Text>
                      </OptionWrapper>
                    </Option>
                  );
                })}
              </Select>
              <HelperMsg>
                {selectedTableColumnOptions.length === 0
                  ? `* Optional (No searchable ${pluginField.COLUMN} to select)`
                  : "* Optional"}
              </HelperMsg>
            </SelectWrapper>
          )}
          <div className="mt-4">
            <GeneratePageSubmitBtn
              disabled={submitButtonDisable}
              isLoading={!!isGeneratingTemplatePage}
              onSubmit={handleFormSubmit}
              showSubmitButton={!!showSubmitButton}
            />
          </div>
        </>
      ) : (
        <GoogleSheetForm
          generatePageAction={generatePageAction}
          googleSheetPluginId={selectedDatasourcePluginId}
          renderSubmitButton={({
            disabled,
            isLoading,
            onSubmit,
          }: {
            onSubmit: () => void;
            disabled: boolean;
            isLoading: boolean;
          }) => (
            <GeneratePageSubmitBtn
              disabled={disabled}
              isLoading={!!isGeneratingTemplatePage || isLoading}
              onSubmit={onSubmit}
              showSubmitButton={!!showSubmitButton}
            />
          )}
          selectedDatasource={selectedDatasource}
          selectedSpreadsheet={selectedTable}
          sheetColumnsHeaderProps={sheetColumnsHeaderProps}
          sheetsListProps={sheetsListProps}
          spreadSheetsProps={spreadSheetsProps}
        />
      )}
    </FormWrapper>
  );
}

export default GeneratePageForm;
