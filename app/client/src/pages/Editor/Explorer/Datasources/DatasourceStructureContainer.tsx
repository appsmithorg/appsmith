import {
  createMessage,
  DATASOURCE_STRUCTURE_INPUT_PLACEHOLDER_TEXT,
  SCHEMA_NOT_AVAILABLE,
  TABLE_OR_COLUMN_NOT_FOUND,
} from "@appsmith/constants/messages";
import type { DatasourceStructure as DatasourceStructureType } from "entities/Datasource";
import type { ReactElement } from "react";
import React, { memo, useEffect, useState, useContext, useMemo } from "react";
import EntityPlaceholder from "../Entity/Placeholder";
import DatasourceStructure, {
  DatasourceStructureContext,
} from "./DatasourceStructure";
import { SearchInput, Text } from "design-system";
import styled from "styled-components";
import { getIsFetchingDatasourceStructure } from "selectors/entitiesSelector";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import DatasourceStructureLoadingContainer from "./DatasourceStructureLoadingContainer";
import DatasourceStructureNotFound from "./DatasourceStructureNotFound";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { PluginName } from "entities/Action";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { setFeatureWalkthroughShown } from "utils/storage";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import { SCHEMA_SECTION_ID } from "entities/Action";

type Props = {
  datasourceId: string;
  datasourceStructure?: DatasourceStructureType;
  step: number;
  context: DatasourceStructureContext;
  pluginName?: string;
  currentActionId?: string;
  onEntityTableClick?: (table: string) => void;
  tableName?: string;
  customEditDatasourceFn?: () => void;
};

// leaving out DynamoDB and Firestore because they have a schema but not templates
export const SCHEMALESS_PLUGINS: Array<string> = [
  PluginName.SMTP,
  PluginName.TWILIO,
  PluginName.HUBSPOT,
  PluginName.ELASTIC_SEARCH,
  PluginName.AIRTABLE,
  PluginName.GRAPHQL,
  PluginName.REST_API,
  PluginName.REDIS,
  PluginName.GOOGLE_SHEETS,
];

const DatasourceStructureSearchContainer = styled.div`
  margin-bottom: 8px;
  position: sticky;
  top: 0;
  overflow: hidden;
  z-index: 10;
  background: white;
`;

const Container = (props: Props) => {
  const isLoading = useSelector((state: AppState) =>
    getIsFetchingDatasourceStructure(state, props.datasourceId),
  );
  let view: ReactElement<Props> | JSX.Element = <div />;

  const [datasourceStructure, setDatasourceStructure] = useState<
    DatasourceStructureType | undefined
  >(props.datasourceStructure);
  const [hasSearchedOccured, setHasSearchedOccured] = useState(false);

  const { isOpened: isWalkthroughOpened, popFeature } =
    useContext(WalkthroughContext) || {};

  const attachCloseWalkthrough =
    props.context !== DatasourceStructureContext.EXPLORER &&
    isWalkthroughOpened &&
    !isLoading &&
    !props.datasourceStructure?.tables?.length;

  const closeWalkthrough = () => {
    popFeature && popFeature("DATASOURCE_SCHEMA_CONTAINER");
    setFeatureWalkthroughShown(FEATURE_WALKTHROUGH_KEYS.ds_schema, true);
  };

  useEffect(() => {
    const schemaContainer = document.querySelector(`#${SCHEMA_SECTION_ID}`);
    if (schemaContainer && attachCloseWalkthrough) {
      schemaContainer.addEventListener("click", closeWalkthrough);
    }
    return () => {
      if (schemaContainer && attachCloseWalkthrough) {
        schemaContainer.removeEventListener("click", closeWalkthrough);
      }
    };
  }, [attachCloseWalkthrough]);

  useEffect(() => {
    if (datasourceStructure !== props.datasourceStructure) {
      setDatasourceStructure(props.datasourceStructure);
    }
  }, [props.datasourceStructure]);

  const flatStructure = useMemo(() => {
    if (!props.datasourceStructure?.tables?.length) return [];
    const list: string[] = [];

    props.datasourceStructure.tables.map((table) => {
      // if the column is empty push the table name alone.
      if (table.columns.length === 0) {
        list.push(`${table.name}~`);
      }
      table.columns.forEach((column) => {
        list.push(`${table.name}~${column.name}`);
      });
    });

    return list;
  }, [props.datasourceStructure]);

  const handleOnChange = (value: string) => {
    if (!props.datasourceStructure?.tables?.length) return;

    if (value.length > 0) {
      !hasSearchedOccured && setHasSearchedOccured(true);
    } else {
      hasSearchedOccured && setHasSearchedOccured(false);
    }

    const tables = new Set();

    flatStructure.forEach((structure: string) => {
      const segments = structure.split("~");

      // if the value is present in the table but not in the columns, add the table
      if (segments[0].toLowerCase().includes(value)) {
        tables.add(segments[0]);
        return;
      }
    });

    const filteredDastasourceStructure =
      props.datasourceStructure.tables.filter((table) =>
        tables.has(table.name),
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
          {props.context !== DatasourceStructureContext.EXPLORER && (
            <DatasourceStructureSearchContainer>
              <SearchInput
                className="datasourceStructure-search"
                endIcon="close"
                onChange={(value) => handleOnChange(value)}
                placeholder={createMessage(
                  DATASOURCE_STRUCTURE_INPUT_PLACEHOLDER_TEXT,
                )}
                size={"md"}
                startIcon="search"
                type="text"
              />
            </DatasourceStructureSearchContainer>
          )}
          {!!datasourceStructure?.tables?.length && (
            <DatasourceStructure
              context={props.context}
              currentActionId={props.currentActionId || ""}
              datasourceId={props.datasourceId}
              forceExpand={hasSearchedOccured}
              step={props.step + 1}
              tables={datasourceStructure.tables}
            />
          )}

          {!datasourceStructure?.tables?.length && (
            <Text kind="body-s" renderAs="p">
              {createMessage(TABLE_OR_COLUMN_NOT_FOUND)}
            </Text>
          )}
        </>
      );
    } else {
      if (props.context !== DatasourceStructureContext.EXPLORER) {
        view = (
          <DatasourceStructureNotFound
            context={props.context}
            customEditDatasourceFn={props?.customEditDatasourceFn}
            datasourceId={props.datasourceId}
            error={
              !!props.datasourceStructure &&
              "error" in props.datasourceStructure
                ? props.datasourceStructure.error
                : { message: createMessage(SCHEMA_NOT_AVAILABLE) }
            }
            pluginName={props?.pluginName || ""}
          />
        );
      } else {
        view = (
          <EntityPlaceholder step={props.step + 1}>
            {props.datasourceStructure &&
            props.datasourceStructure.error &&
            props.datasourceStructure.error.message &&
            props.datasourceStructure.error.message !== "null"
              ? props.datasourceStructure.error.message
              : createMessage(SCHEMA_NOT_AVAILABLE)}
          </EntityPlaceholder>
        );
      }
    }
  } else if (
    // intentionally leaving this here in case we want to show loading states in the explorer or query editor page
    props.context !== DatasourceStructureContext.EXPLORER &&
    isLoading
  ) {
    view = <DatasourceStructureLoadingContainer />;
  }

  return view;
};

export const DatasourceStructureContainer = memo(Container);

DatasourceStructureContainer.displayName = "DatasourceStructureContainer";
