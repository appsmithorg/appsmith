import { Callout, Flex, Text } from "@appsmith/ads";
import type { AppState } from "ee/reducers";
import { getActionSchemaDirtyState } from "ee/selectors/entitiesSelector";
import { usePluginActionContext } from "PluginActionEditor";
import React from "react";
import { useSelector } from "react-redux";

export const SchemaIsDirtyCallout = () => {
  const { action } = usePluginActionContext();
  const isSchemaDirty = useSelector((state: AppState) =>
    getActionSchemaDirtyState(state, action.id),
  );

  if (!isSchemaDirty) return null;

  return (
    <div style={{ width: "100%", padding: "8px" }}>
      <Callout kind="warning">
        <Flex flexDirection={"column"} gap="spaces-2">
          <Text kind="heading-s">Unsaved changes</Text>
          <Text kind="body-m">
            You&apos;ve made changes to this query, but haven&apos;t saved the
            new schema. The agent will still use the last saved version, which
            may cause issues.
          </Text>
        </Flex>
      </Callout>
    </div>
  );
};
