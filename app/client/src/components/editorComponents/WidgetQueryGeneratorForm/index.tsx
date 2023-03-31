import type { DropdownOption } from "design-system-old";
import produce from "immer";
import { noop, set } from "lodash";
import React, { useCallback, useMemo, useState } from "react";
import { CommonControls } from "./CommonControls";
import { DEFAULT_DROPDOWN_OPTION } from "./constants";
import { DatasourceSpecificControls } from "./DatasourceSpecificControls";
import { Wrapper } from "./styles";
import type { QueryGeneratorFromProps } from "./types";
import WidgetSpecificControls from "./WidgetSpecificControls";

type QueryGeneratorFormContextType = {
  config: {
    datasource: DropdownOption;
    table: DropdownOption;
    column: DropdownOption;
    sheet: DropdownOption;
    tableHeaderIndex: number;
  };
  updateConfig: (propertyName: string, value: unknown) => void;
};

const DEFAULT_CONTEXT_VALUE = {
  config: {
    datasource: DEFAULT_DROPDOWN_OPTION,
    table: DEFAULT_DROPDOWN_OPTION,
    column: DEFAULT_DROPDOWN_OPTION,
    sheet: DEFAULT_DROPDOWN_OPTION,
    tableHeaderIndex: 1,
  },
  updateConfig: noop,
};

export const QueryGeneratorFormContext =
  React.createContext<QueryGeneratorFormContextType>(DEFAULT_CONTEXT_VALUE);

function QueryGeneratorForm(props: QueryGeneratorFromProps) {
  const [config, setConfig] = useState(DEFAULT_CONTEXT_VALUE);

  const updateConfig = useCallback(
    (propertyName, value) => {
      setConfig(
        produce(config, (draftConfig) => {
          set(draftConfig, propertyName, value);
        }),
      );
    },
    [config],
  );

  const contextValue = useMemo(() => {
    return {
      config,
      updateConfig,
    };
  }, [config, updateConfig]);

  return (
    <Wrapper>
      <QueryGeneratorFormContext.Provider value={contextValue}>
        <CommonControls />
        <DatasourceSpecificControls />
        <WidgetSpecificControls />
      </QueryGeneratorFormContext.Provider>
    </Wrapper>
  );
}

export default QueryGeneratorForm;
