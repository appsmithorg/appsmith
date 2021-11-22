import React, { useEffect, useState, useCallback, useRef } from "react";
import SQLForm from "./pluginForm/SQLForm";
import GoogleSheetForm from "./pluginForm/GoogleSheetForm";
import S3Form from "./pluginForm/S3Form";
import styled from "styled-components";

import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { Label, SelectWrapper } from "./styles";

import {
  createMessage,
  GEN_CRUD_DATASOURCE_DROPDOWN_LABEL,
} from "constants/messages";
import DataSourceOption from "../DataSourceOption";
import { GenerateCRUDEnabledPluginMap } from "api/PluginApi";
import { useDatasourceOptions } from "./hooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { DEFAULT_DROPDOWN_OPTION, DROPDOWN_DIMENSION } from "./constants";
import { GeneratePagePayload } from "./types";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getCurrentApplicationId } from "selectors/editorSelectors";

import {
  getFirstTimeUserOnboardingComplete,
  getIsFirstTimeUserOnboardingEnabled,
} from "selectors/onboardingSelectors";
import { useSelector, useDispatch } from "react-redux";
import {
  getDatasources,
  getIsFetchingDatasourceStructure,
  getGenerateCRUDEnabledPluginMap,
  getDatasourcesStructure,
} from "selectors/entitiesSelector";

import { Datasource } from "entities/Datasource";
import { fetchDatasourceStructure } from "actions/datasourceActions";
import { generateTemplateToUpdatePage } from "actions/pageActions";
import { useParams, useLocation } from "react-router";
import { ExplorerURLParams } from "../../../Explorer/helpers";
import {
  INTEGRATION_EDITOR_URL,
  INTEGRATION_TABS,
  DATA_SOURCES_EDITOR_ID_URL,
} from "constants/routes";
import history from "utils/history";
import { getQueryParams } from "utils/AppsmithUtils";
import { getIsGeneratingTemplatePage } from "selectors/pageListSelectors";
import { convertToQueryParams } from "constants/routes";
import { IconName, IconSize } from "components/ads/Icon";
import { Colors } from "constants/Colors";

const formComponentMap = {
  SQL: SQLForm,
  GOOGLE_SHEET: GoogleSheetForm,
  S3: S3Form,
};

const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

// Constants

const datasourceIcon: IconName = "tables";

const GENERATE_PAGE_MODE = {
  NEW: "NEW", // a new page is created for the template. (new pageId created)
  REPLACE_EMPTY: "REPLACE_EMPTY", // current page's content (DSL) is updated to template DSL. (same pageId)
};

function BaseForm() {
  const dispatch = useDispatch();
  const querySearch = useLocation().search;

  const { pageId: currentPageId } = useParams<ExplorerURLParams>();

  const applicationId = useSelector(getCurrentApplicationId);

  const datasources: Datasource[] = useSelector(getDatasources);
  // const isGeneratingTemplatePage = useSelector(getIsGeneratingTemplatePage);
  const currentMode = useRef(GENERATE_PAGE_MODE.REPLACE_EMPTY);

  const [datasourceIdToBeSelected, setDatasourceIdToBeSelected] = useState<
    string
  >("");
  const datasourcesStructure = useSelector(getDatasourcesStructure);

  const isFetchingDatasourceStructure = useSelector(
    getIsFetchingDatasourceStructure,
  );

  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap = useSelector(
    getGenerateCRUDEnabledPluginMap,
  );

  // const [datasourceTableOptions, setSelectedDatasourceTableOptions] = useState<
  //   DropdownOptions
  // >([]);

  // const [selectedTableColumnOptions, setSelectedTableColumnOptions] = useState<
  //   DropdownOptions
  // >([]);

  const [selectedDatasource, selectDataSource] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );

  // const selectedDatasourcePluginId: string = selectedDatasource.data?.pluginId;
  // const selectedDatasourcePluginPackageName: string =
  //   generateCRUDSupportedPlugin[selectedDatasourcePluginId];

  const [
    selectedDatasourceIsInvalid,
    setSelectedDatasourceIsInvalid,
  ] = useState(false);

  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const isFirstTimeUserOnboardingComplete = useSelector(
    getFirstTimeUserOnboardingComplete,
  );

  const dataSourceOptions = useDatasourceOptions({
    datasources,
    generateCRUDSupportedPlugin,
  });

  // const spreadSheetsProps = useSpreadSheets({
  //   setSelectedDatasourceTableOptions,
  //   setSelectedDatasourceIsInvalid,
  // });

  // const sheetsListProps = useSheetsList();

  // const sheetColumnsHeaderProps = useSheetColumnHeaders();

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
        // setSelectedDatasourceTableOptions([]);
        // setSelectedTableColumnOptions([]);
        setSelectedDatasourceIsInvalid(false);
        if (dataSourceObj.id) {
          switch (pluginPackageName) {
            // case PLUGIN_PACKAGE_NAME.S3:
            //   fetchBucketList({ selectedDatasource: dataSourceObj });
            //   break;
            // case PLUGIN_PACKAGE_NAME.GOOGLE_SHEETS:
            //   break;
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
      // setSelectedDatasourceTableOptions,
      // setSelectedTableColumnOptions,
      dispatch,
      setSelectedDatasourceIsInvalid,
      selectedDatasource,
      generateCRUDSupportedPlugin,
    ],
  );

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
            iconSize: IconSize.LARGE,
            iconColor: Colors.BURNING_ORANGE,
            data: {
              columns,
            },
          }));
          // setSelectedDatasourceTableOptions(newTables);
        }
      }
    }
  }, [
    datasourcesStructure,
    selectedDatasource,
    isFetchingDatasourceStructure,
    setSelectedDatasourceIsInvalid,
    // setSelectedDatasourceTableOptions,
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
  }, [
    dataSourceOptions,
    datasourceIdToBeSelected,
    onSelectDataSource,
    setDatasourceIdToBeSelected,
  ]);

  useEffect(() => {
    if (querySearch) {
      const queryParams = getQueryParams();
      const datasourceId = queryParams.datasourceId;
      const generateNewPage = queryParams.new_page;
      if (datasourceId) {
        if (generateNewPage) {
          currentMode.current = GENERATE_PAGE_MODE.NEW;
        } else {
          currentMode.current = GENERATE_PAGE_MODE.REPLACE_EMPTY;
        }
        setDatasourceIdToBeSelected(datasourceId);
        delete queryParams.datasourceId;
        delete queryParams.new_page;
        const redirectURL =
          window.location.pathname + convertToQueryParams(queryParams);
        history.replace(redirectURL);
      }
    }
  }, [querySearch, setDatasourceIdToBeSelected]);

  const routeToCreateNewDatasource = () => {
    AnalyticsUtil.logEvent("GEN_CRUD_PAGE_CREATE_NEW_DATASOURCE");
    history.push(
      INTEGRATION_EDITOR_URL(
        applicationId,
        currentPageId,
        INTEGRATION_TABS.NEW,
        "",
        { isGeneratePageMode: "generate-page" },
      ),
    );
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
        currentMode.current === GENERATE_PAGE_MODE.NEW
          ? ""
          : currentPageId || "",
      columns: data.columns || [],
      searchColumn: data.searchColumn,
      tableName: data.tableName,
      datasourceId: selectedDatasource.id || "",
      mode: currentMode.current,
      ...extraParams,
    };

    AnalyticsUtil.logEvent("GEN_CRUD_PAGE_FORM_SUBMIT");
    dispatch(generateTemplateToUpdatePage(payload));
    if (isFirstTimeUserOnboardingEnabled) {
      dispatch({
        type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
        payload: "",
      });
    }
    if (isFirstTimeUserOnboardingComplete) {
      dispatch({
        type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_COMPLETE,
        payload: false,
      });
    }
  };

  // const showSearchableColumn =
  //   !!selectedTable.value &&
  //   PLUGIN_PACKAGE_NAME.S3 !== selectedDatasourcePluginPackageName;

  // const showSubmitButton =
  //   selectedTable.value &&
  //   !showEditDatasourceBtn &&
  //   !fetchingDatasourceConfigs &&
  //   !fetchingDatasourceConfigError &&
  //   !!selectedDatasource.value;

  // const submitButtonDisable =
  //   !selectedTable.value || !showSubmitButton || isSelectedTableEmpty;

  return (
    <FormWrapper>
      <SelectWrapper width={DROPDOWN_DIMENSION.WIDTH}>
        <Label>{createMessage(GEN_CRUD_DATASOURCE_DROPDOWN_LABEL)}</Label>
        <Dropdown
          cypressSelector="t--datasource-dropdown"
          dropdownMaxHeight={"300px"}
          height={DROPDOWN_DIMENSION.HEIGHT}
          onSelect={onSelectDataSource}
          optionWidth={DROPDOWN_DIMENSION.WIDTH}
          options={dataSourceOptions}
          renderOption={({ isSelectedNode, option, optionClickHandler }) => (
            <DataSourceOption
              cypressSelector="t--datasource-dropdown-option"
              extraProps={{ routeToCreateNewDatasource }}
              isSelectedNode={isSelectedNode}
              key={option.id}
              option={option}
              optionClickHandler={optionClickHandler}
              optionWidth={DROPDOWN_DIMENSION.WIDTH}
            />
          )}
          selected={selectedDatasource}
          showLabelOnly
          width={DROPDOWN_DIMENSION.WIDTH}
        />
      </SelectWrapper>
    </FormWrapper>
  );
}

export default BaseForm;
