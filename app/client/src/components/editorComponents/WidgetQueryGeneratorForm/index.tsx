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
import { getOneClickBindingConfigForWidget } from "selectors/oneClickBindingSelectors";

type WidgetQueryGeneratorFormContextType = {
  widgetId: string;
  propertyValue: string;
  config: {
    datasource: string;
    table: string;
    alias: Record<string, string>;
    sheet: string;
    searchableColumn: string;
    tableHeaderIndex: number;
  };
  updateConfig: (propertyName: string, value: unknown) => void;
  addSnippet: () => void;
  addBinding: (binding?: string, makeDynamicPropertyPath?: boolean) => void;
  isSourceOpen: boolean;
  onSourceClose: () => void;
};

const DEFAULT_CONFIG_VALUE = {
  datasource: "",
  table: "",
  sheet: "",
  alias: {},
  searchableColumn: "",
  tableHeaderIndex: 1,
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
  isSourceOpen: boolean;
  onSourceClose: () => void;
};

function WidgetQueryGeneratorForm(props: Props) {
  const dispatch = useDispatch();

  const [pristine, setPristine] = useState(true);

  const {
    entityId,
    expectedType,
    isSourceOpen,
    onSourceClose,
    onUpdate,
    propertyPath,
    propertyValue,
    widgetId,
  } = props;

  const formData = useSelector(getOneClickBindingConfigForWidget(widgetId));

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

  const [config, setConfig] = useState({
    ...formState,
    widgetId,
  });

  const updateConfig = (propertyName: string, value: unknown) => {
    setPristine(false);

    setConfig(
      produce(config, (draftConfig) => {
        set(draftConfig, propertyName, value);

        if (propertyName === "datasource") {
          set(draftConfig, "table", "");
          set(draftConfig, "sheet", "");
          set(draftConfig, "searchableColumn", "");
          set(draftConfig, "alias", {});
        }

        if (propertyName === "table") {
          set(draftConfig, "sheet", "");
          set(draftConfig, "searchableColumn", "");
          set(draftConfig, "alias", {});
        }

        if (propertyName === "sheet") {
          set(draftConfig, "searchableColumn", "");
          set(draftConfig, "alias", {});
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
  ]);

  useEffect(() => {
    if (!pristine) {
      updateConfig("datasource", "");
    }
  }, [propertyValue]);

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
