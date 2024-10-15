import {
  createMessage,
  DATASOURCE_STRUCTURE_INPUT_PLACEHOLDER_TEXT,
  SCHEMA_NOT_AVAILABLE,
  TABLE_NOT_FOUND,
} from "ee/constants/messages";
import type { DatasourceStructure as DatasourceStructureType } from "entities/Datasource";
import { DatasourceStructureContext } from "entities/Datasource";
import type { ReactElement } from "react";
import React, { memo, useCallback, useEffect, useState } from "react";
import DatasourceStructure from "./DatasourceStructure";
import { Button, Flex, SearchInput, Text } from "@appsmith/ads";
import { getIsFetchingDatasourceStructure } from "ee/selectors/entitiesSelector";
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import ItemLoadingIndicator from "./ItemLoadingIndicator";
import DatasourceStructureNotFound from "./DatasourceStructureNotFound";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { PluginName } from "entities/Action";
import { DatasourceStructureSearchContainer } from "./SchemaViewModeCSS";
import { refreshDatasourceStructure } from "actions/datasourceActions";

interface Props {
  datasourceId: string;
  datasourceName: string;
  datasourceStructure?: DatasourceStructureType;
  step: number;
  context: DatasourceStructureContext;
  pluginName?: string;
  currentActionId?: string;
  onEntityTableClick?: (table: string) => void;
  tableName?: string;
  customEditDatasourceFn?: () => void;
  showRefresh?: boolean;
}

// leaving out DynamoDB and Firestore because they have a schema but not templates
export const SCHEMALESS_PLUGINS: Array<string> = [
  PluginName.GRAPHQL,
  PluginName.REST_API,
];

const Container = (props: Props) => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state: AppState) =>
    getIsFetchingDatasourceStructure(state, props.datasourceId),
  );
  let view: ReactElement<Props> | JSX.Element = <div />;

  const [datasourceStructure, setDatasourceStructure] = useState<
    DatasourceStructureType | undefined
  >(props.datasourceStructure);

  const refreshStructure = useCallback(() => {
    dispatch(refreshDatasourceStructure(props.datasourceId, props.context));
  }, []);

  useEffect(() => {
    if (datasourceStructure !== props.datasourceStructure) {
      setDatasourceStructure(props.datasourceStructure);
    }
  }, [props.datasourceStructure]);

  const handleOnChange = (value: string) => {
    if (!props.datasourceStructure?.tables?.length) return;

    const filteredDastasourceStructure =
      props.datasourceStructure.tables.filter((table) =>
        table.name.toLowerCase().includes(value.toLowerCase()),
      );

    setDatasourceStructure({ tables: filteredDastasourceStructure });

    AnalyticsUtil.logEvent("DATASOURCE_SCHEMA_SEARCH", {
      datasourceId: props.datasourceId,
      pluginName: props.pluginName,
    });
  };

  if (!isLoading) {
    if (props.datasourceStructure?.tables?.length) {
      view = (
        <>
          {!!datasourceStructure?.tables?.length && (
            <DatasourceStructure
              context={props.context}
              currentActionId={props.currentActionId || ""}
              datasourceId={props.datasourceId}
              onEntityTableClick={props.onEntityTableClick}
              showTemplates={
                props.context !==
                DatasourceStructureContext.DATASOURCE_VIEW_MODE
              }
              step={props.step + 1}
              // Selected table name for the view mode datasource preview data page
              tableName={props.tableName}
              tables={datasourceStructure.tables}
            />
          )}

          {!datasourceStructure?.tables?.length && (
            <Text kind="body-s" renderAs="p">
              {createMessage(TABLE_NOT_FOUND)}
            </Text>
          )}
        </>
      );
    } else {
      view = (
        <DatasourceStructureNotFound
          context={props.context}
          customEditDatasourceFn={props?.customEditDatasourceFn}
          datasourceId={props.datasourceId}
          error={
            !!props.datasourceStructure && "error" in props.datasourceStructure
              ? props.datasourceStructure.error
              : { message: createMessage(SCHEMA_NOT_AVAILABLE) }
          }
          pluginName={props?.pluginName || ""}
        />
      );
    }
  } else if (
    // intentionally leaving this here in case we want to show loading states in the explorer or query editor page
    isLoading
  ) {
    view = (
      <Flex padding="spaces-4">
        <ItemLoadingIndicator type="SCHEMA" />
      </Flex>
    );
  }

  return (
    <>
      <DatasourceStructureSearchContainer
        className={`t--search-container--${props.context.toLowerCase()}`}
      >
        {props.showRefresh ? (
          <Button
            className="datasourceStructure-refresh"
            isIconButton
            kind="tertiary"
            onClick={refreshStructure}
            size="md"
            startIcon="refresh"
          />
        ) : null}
        <SearchInput
          className="datasourceStructure-search"
          endIcon="close"
          onChange={(value: string) => handleOnChange(value)}
          placeholder={createMessage(
            DATASOURCE_STRUCTURE_INPUT_PLACEHOLDER_TEXT,
            props.datasourceName,
          )}
          size={"sm"}
          startIcon="search"
          //@ts-expect-error Fix this the next time the file is edited
          type="text"
        />
      </DatasourceStructureSearchContainer>
      {view}
    </>
  );
};

export const DatasourceStructureContainer = memo(Container);

DatasourceStructureContainer.displayName = "DatasourceStructureContainer";
