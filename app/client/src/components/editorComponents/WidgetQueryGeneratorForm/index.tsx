import React, { useCallback, useMemo, useState } from "react";
import produce from "immer";
import { noop, set } from "lodash";

import { CommonControls } from "./CommonControls";
import { ConnectData } from "./ConnectData";
import { DEFAULT_DROPDOWN_OPTION } from "./constants";
import { DatasourceSpecificControls } from "./DatasourceSpecificControls";
import { Wrapper } from "./styles";
import type { DropdownOptionType } from "./types";
import WidgetSpecificControls from "./WidgetSpecificControls";
import { connect } from "react-redux";
import { executeCommandAction } from "actions/apiPaneActions";
import { SlashCommand } from "entities/Action";

type WidgetQueryGeneratorFormContextType = {
  config: {
    datasource: DropdownOptionType;
    table: DropdownOptionType;
    column: Record<string, DropdownOptionType>;
    sheet: DropdownOptionType;
    tableHeaderIndex: number;
  };
  updateConfig: (propertyName: string, value: unknown) => void;
  addSnippet: () => void;
  addBinding: () => void;
};

const DEFAULT_CONFIG_VALUE = {
  datasource: DEFAULT_DROPDOWN_OPTION,
  table: DEFAULT_DROPDOWN_OPTION,
  sheet: DEFAULT_DROPDOWN_OPTION,
  column: {},
  tableHeaderIndex: 1,
};

const DEFAULT_CONTEXT_VALUE = {
  config: DEFAULT_CONFIG_VALUE,
  updateConfig: noop,
  addSnippet: noop,
  addBinding: noop,
};

export const WidgetQueryGeneratorFormContext =
  React.createContext<WidgetQueryGeneratorFormContextType>(
    DEFAULT_CONTEXT_VALUE,
  );

type Props = {
  openSnippetModal: (
    propertyPath: string,
    entityId: string,
    expectedType: string,
    callback: (snippet: string) => void,
  ) => void;
  propertyPath: string;
  expectedType?: string;
  entityId: string;
  onUpdate: (snippet: string) => void;
};

function WidgetQueryGeneratorForm(props: Props) {
  const { entityId, expectedType, onUpdate, openSnippetModal, propertyPath } =
    props;

  const [config, setConfig] = useState(DEFAULT_CONFIG_VALUE);

  const updateConfig = useCallback(
    (propertyName: string, value: unknown) => {
      setConfig(
        produce(config, (draftConfig) => {
          set(draftConfig, propertyName, value);

          if (propertyName === "datasource") {
            set(draftConfig, "table", DEFAULT_DROPDOWN_OPTION);
            set(draftConfig, "sheet", DEFAULT_DROPDOWN_OPTION);
            set(draftConfig, "searchable_columns", DEFAULT_DROPDOWN_OPTION);
            set(draftConfig, "column", {});
          }

          if (propertyName === "table") {
            set(draftConfig, "sheet", DEFAULT_DROPDOWN_OPTION);
            set(draftConfig, "searchable_columns", DEFAULT_DROPDOWN_OPTION);
            set(draftConfig, "column", {});
          }

          if (propertyName === "sheet") {
            set(draftConfig, "searchable_columns", DEFAULT_DROPDOWN_OPTION);
            set(draftConfig, "column", {});
          }
        }),
      );
    },
    [config],
  );

  const addSnippet = useCallback(() => {
    openSnippetModal(
      propertyPath,
      entityId,
      expectedType || "Array",
      (snippet: string) => {
        onUpdate(snippet);
      },
    );
  }, [openSnippetModal, propertyPath, entityId, expectedType, onUpdate]);

  const addBinding = useCallback(() => {
    onUpdate("{{}}");
  }, [onUpdate]);

  const contextValue = useMemo(() => {
    return {
      config,
      updateConfig,
      addSnippet,
      addBinding,
    };
  }, [config, updateConfig, addSnippet, addBinding]);

  return (
    <Wrapper>
      <WidgetQueryGeneratorFormContext.Provider value={contextValue}>
        <CommonControls />
        <DatasourceSpecificControls />
        <WidgetSpecificControls hasSearchableColumn />
        <ConnectData />
      </WidgetQueryGeneratorFormContext.Provider>
    </Wrapper>
  );
}

export default connect(null, (dispatch) => ({
  openSnippetModal: (
    propertyPath: string,
    entityId: string,
    expectedType: string,
    callback: (snippet: string) => void,
  ) => {
    dispatch(
      executeCommandAction({
        actionType: SlashCommand.NEW_SNIPPET,
        args: {
          entityType: "widget",
          expectedType: expectedType,
          entityId: entityId,
          propertyPath: propertyPath,
        },
        callback,
      }),
    );
  },
}))(WidgetQueryGeneratorForm);
