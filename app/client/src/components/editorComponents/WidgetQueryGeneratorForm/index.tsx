import React, { useCallback, useEffect, useMemo, useState } from "react";
import produce from "immer";
import { noop, set } from "lodash";

import { CommonControls } from "./CommonControls";
import { ConnectData } from "./ConnectData";
import { DatasourceSpecificControls } from "./DatasourceSpecificControls";
import { GlobalStyles, Wrapper } from "./styles";
import WidgetSpecificControls from "./WidgetSpecificControls";
import { useDispatch, useSelector } from "react-redux";
import { executeCommandAction } from "actions/apiPaneActions";
import { SlashCommand } from "entities/Action";
import {
  getisOneClickBindingConnectingForWidget,
  getIsOneClickBindingOptionsVisibility,
  getOneClickBindingConfigForWidget,
} from "selectors/oneClickBindingSelectors";
import { updateOneClickBindingOptionsVisibility } from "actions/oneClickBindingActions";

type WidgetQueryGeneratorFormContextType = {
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
  };
  updateConfig: (
    property: string | Record<string, unknown>,
    value?: unknown,
  ) => void;
  addSnippet: () => void;
  addBinding: (binding?: string, makeDynamicPropertyPath?: boolean) => void;
  isSourceOpen: boolean;
  onSourceClose: () => void;
  errorMsg: string;
};

const DEFAULT_CONFIG_VALUE = {
  datasource: "",
  table: "",
  sheet: "",
  alias: {},
  searchableColumn: "",
  tableHeaderIndex: 1,
  datasourcePluginType: "",
  datasourcePluginName: "",
};

const DEFAULT_CONTEXT_VALUE = {
  config: DEFAULT_CONFIG_VALUE,
  updateConfig: noop,
  addSnippet: noop,
  addBinding: noop,
  widgetId: "",
  propertyValue: "",
  isSourceOpen: false,
  onSourceClose: noop,
  errorMsg: "",
  propertyName: "",
};

export const WidgetQueryGeneratorFormContext =
  React.createContext<WidgetQueryGeneratorFormContextType>(
    DEFAULT_CONTEXT_VALUE,
  );

type Props = {
  propertyPath: string;
  propertyValue: string;
  expectedType?: string;
  entityId: string;
  onUpdate: (snippet?: string, makeDynamicPropertyPath?: boolean) => void;
  widgetId: string;
  errorMsg: string;
};

function WidgetQueryGeneratorForm(props: Props) {
  const dispatch = useDispatch();

  const [pristine, setPristine] = useState(true);

  const {
    entityId,
    errorMsg,
    expectedType,
    onUpdate,
    propertyPath,
    propertyValue,
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
      produce(config, (draftConfig) => {
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

  const addSnippet = useCallback(() => {
    dispatch(
      executeCommandAction({
        actionType: SlashCommand.NEW_SNIPPET,
        args: {
          entityType: "widget",
          expectedType: expectedType || "Array",
          entityId: entityId,
          propertyPath: propertyPath,
        },
        callback: (snippet: string) => {
          onUpdate(snippet, true);
        },
      }),
    );
  }, [propertyPath, entityId, expectedType, onUpdate]);

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
      addSnippet,
      addBinding,
      propertyValue,
      widgetId,
      isSourceOpen,
      onSourceClose,
      errorMsg,
      propertyName: propertyPath,
    };
  }, [
    config,
    updateConfig,
    addSnippet,
    addBinding,
    propertyValue,
    widgetId,
    isSourceOpen,
    onSourceClose,
    errorMsg,
    propertyPath,
  ]);

  useEffect(() => {
    if (!pristine && propertyValue && !isConnecting) {
      updateConfig("datasource", "");
    }
  }, [isConnecting]);

  return (
    <Wrapper>
      <GlobalStyles />
      <WidgetQueryGeneratorFormContext.Provider value={contextValue}>
        <CommonControls />
        <DatasourceSpecificControls />
        <WidgetSpecificControls hasSearchableColumn />
        <ConnectData />
      </WidgetQueryGeneratorFormContext.Provider>
    </Wrapper>
  );
}

export default WidgetQueryGeneratorForm;
