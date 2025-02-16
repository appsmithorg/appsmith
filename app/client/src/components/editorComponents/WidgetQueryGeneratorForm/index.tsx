import React, { useCallback, useEffect, useMemo, useState } from "react";
import { create } from "mutative";
import { noop, set } from "lodash";

import { CommonControls } from "./CommonControls";
import { ConnectData } from "./ConnectData";
import { DatasourceSpecificControls } from "./DatasourceSpecificControls";
import { Wrapper } from "./styles";
import WidgetSpecificControls from "./WidgetSpecificControls";
import { useDispatch, useSelector } from "react-redux";
import {
  getisOneClickBindingConnectingForWidget,
  getIsOneClickBindingOptionsVisibility,
  getOneClickBindingConfigForWidget,
} from "selectors/oneClickBindingSelectors";
import { updateOneClickBindingOptionsVisibility } from "actions/oneClickBindingActions";
import type { AlertMessage, Alias, OtherField } from "./types";
import { CONNECT_BUTTON_TEXT, createMessage } from "ee/constants/messages";
import { DROPDOWN_VARIANT } from "./CommonControls/DatasourceDropdown/types";
import type { getDefaultQueryBindingValue } from "./CommonControls/DatasourceDropdown/useSource/useConnectToOptions";

export interface WidgetQueryGeneratorFormContextType {
  widgetId: string;
  propertyValue: string;
  propertyName: string;
  config: {
    datasource: string;
    table: string;
    alias: Record<string, string>;
    sheet: string;
    searchableColumn: string;
    tableHeaderIndex: number;
    datasourcePluginType: string;
    datasourcePluginName: string;
    datasourceConnectionMode: string;
    selectedColumns?: string[];
    otherFields?: Record<string, unknown>;
  };
  updateConfig: (
    property: string | Record<string, unknown>,
    value?: unknown,
  ) => void;
  addBinding: (binding?: string, makeDynamicPropertyPath?: boolean) => void;
  isSourceOpen: boolean;
  onSourceClose: () => void;
  errorMsg: string;
  expectedType: string;
  sampleData: string;
  aliases: Alias[];
  otherFields: OtherField[];
  excludePrimaryColumnFromQueryGeneration?: boolean;
  isConnectableToWidget?: boolean;
  datasourceDropdownVariant: DROPDOWN_VARIANT;
  alertMessage?: AlertMessage | null;
  showEditFieldsModal?: boolean;
  allowedDatasourceTypes?: string[];
  getQueryBindingValue?: typeof getDefaultQueryBindingValue;
}

const DEFAULT_CONFIG_VALUE = {
  datasource: "",
  table: "",
  sheet: "",
  alias: {},
  searchableColumn: "",
  tableHeaderIndex: 1,
  datasourcePluginType: "",
  datasourcePluginName: "",
  datasourceConnectionMode: "",
  otherFields: {},
};

const DEFAULT_CONTEXT_VALUE = {
  config: DEFAULT_CONFIG_VALUE,
  updateConfig: noop,
  addBinding: noop,
  widgetId: "",
  propertyValue: "",
  isSourceOpen: false,
  onSourceClose: noop,
  errorMsg: "",
  propertyName: "",
  expectedType: "",
  sampleData: "",
  aliases: [],
  otherFields: [],
  excludePrimaryColumnFromQueryGeneration: false,
  isConnectableToWidget: false,
  datasourceDropdownVariant: DROPDOWN_VARIANT.CONNECT_TO_DATASOURCE,
  alertMessage: null,
};

export const WidgetQueryGeneratorFormContext =
  React.createContext<WidgetQueryGeneratorFormContextType>(
    DEFAULT_CONTEXT_VALUE,
  );

interface Props {
  propertyPath: string;
  propertyValue: string;
  onUpdate: (snippet?: string, makeDynamicPropertyPath?: boolean) => void;
  widgetId: string;
  errorMsg: string;
  expectedType: string;
  aliases: Alias[];
  searchableColumn: boolean;
  sampleData: string;
  showEditFieldsModal?: boolean;
  excludePrimaryColumnFromQueryGeneration?: boolean;
  otherFields?: OtherField[];
  isConnectableToWidget?: boolean;
  datasourceDropdownVariant: DROPDOWN_VARIANT;
  actionButtonCtaText?: string;
  alertMessage?: AlertMessage;
  allowedDatasourceTypes?: WidgetQueryGeneratorFormContextType["allowedDatasourceTypes"];
  getQueryBindingValue?: WidgetQueryGeneratorFormContextType["getQueryBindingValue"];
}

function WidgetQueryGeneratorForm(props: Props) {
  const dispatch = useDispatch();

  const [pristine, setPristine] = useState(true);

  const {
    actionButtonCtaText = createMessage(CONNECT_BUTTON_TEXT),
    alertMessage,
    aliases,
    allowedDatasourceTypes,
    datasourceDropdownVariant,
    errorMsg,
    excludePrimaryColumnFromQueryGeneration,
    expectedType,
    getQueryBindingValue,
    isConnectableToWidget,
    onUpdate,
    otherFields = [],
    propertyPath,
    propertyValue,
    sampleData,
    searchableColumn,
    showEditFieldsModal = false,
    widgetId,
  } = props;

  const isSourceOpen = useSelector(getIsOneClickBindingOptionsVisibility);

  const formData = useSelector(getOneClickBindingConfigForWidget(widgetId));

  const isConnecting = useSelector(
    getisOneClickBindingConnectingForWidget(widgetId),
  );

  let formState = {
    ...DEFAULT_CONFIG_VALUE,
  };

  if (formData) {
    formState = {
      ...formState,
      datasource: formData.datasourceId,
      table: formData.tableName,
      searchableColumn: formData.searchableColumn,
    };
  }

  const onSourceClose = useCallback(() => {
    dispatch(updateOneClickBindingOptionsVisibility(false));
  }, [dispatch]);

  const [config, setConfig] = useState({
    ...formState,
    widgetId,
  });

  const updateConfig = (
    property: string | Record<string, unknown>,
    value?: unknown,
  ) => {
    setPristine(false);

    setConfig(
      create(config, (draftConfig) => {
        if (
          property === "datasource" ||
          (typeof property === "object" &&
            Object.keys(property).includes("datasource"))
        ) {
          set(draftConfig, "table", "");
          set(draftConfig, "sheet", "");
          set(draftConfig, "searchableColumn", "");
          set(draftConfig, "alias", {});
          set(draftConfig, "datasourcePluginType", "");
          set(draftConfig, "datasourcePluginName", "");
          set(draftConfig, "datasourceConnectionMode", "");
        }

        if (
          property === "table" ||
          (typeof property === "object" &&
            Object.keys(property).includes("table"))
        ) {
          set(draftConfig, "sheet", "");
          set(draftConfig, "searchableColumn", "");
          set(draftConfig, "alias", {});
        }

        if (
          property === "sheet" ||
          (typeof property === "object" &&
            Object.keys(property).includes("sheet"))
        ) {
          set(draftConfig, "searchableColumn", "");
          set(draftConfig, "alias", {});
        }

        if (typeof property === "string") {
          set(draftConfig, property, value);
        } else {
          Object.entries(property).forEach(([name, value]) => {
            set(draftConfig, name, value);
          });
        }
      }),
    );
  };

  const addBinding = useCallback(
    (binding?: string, makeDynamicPropertyPath?: boolean) => {
      onUpdate(binding, makeDynamicPropertyPath);
    },
    [onUpdate],
  );

  const contextValue = useMemo(() => {
    return {
      config: {
        ...config,
      },
      updateConfig,
      addBinding,
      propertyValue,
      widgetId,
      isSourceOpen,
      onSourceClose,
      errorMsg,
      propertyName: propertyPath,
      expectedType,
      sampleData,
      aliases,
      otherFields,
      excludePrimaryColumnFromQueryGeneration,
      isConnectableToWidget,
      datasourceDropdownVariant,
      alertMessage,
      showEditFieldsModal,
      allowedDatasourceTypes,
      getQueryBindingValue,
    };
  }, [
    config,
    updateConfig,
    addBinding,
    propertyValue,
    widgetId,
    isSourceOpen,
    onSourceClose,
    errorMsg,
    propertyPath,
    sampleData,
    aliases,
    otherFields,
    excludePrimaryColumnFromQueryGeneration,
    isConnectableToWidget,
    datasourceDropdownVariant,
    alertMessage,
    showEditFieldsModal,
    allowedDatasourceTypes,
    getQueryBindingValue,
    expectedType,
  ]);

  useEffect(() => {
    if (!pristine && propertyValue && !isConnecting) {
      updateConfig("datasource", "");
    }
  }, [isConnecting]);

  return (
    <Wrapper>
      <WidgetQueryGeneratorFormContext.Provider value={contextValue}>
        <CommonControls />
        <DatasourceSpecificControls />
        <WidgetSpecificControls
          aliases={aliases}
          hasSearchableColumn={searchableColumn}
          otherFields={otherFields}
        />
        <ConnectData btnText={actionButtonCtaText} />
      </WidgetQueryGeneratorFormContext.Provider>
    </Wrapper>
  );
}

export default WidgetQueryGeneratorForm;
