import {
  createMessage,
  DATASOURCE_STRUCTURE_INPUT_PLACEHOLDER_TEXT,
  SCHEMA_NOT_AVAILABLE,
  TABLE_NOT_FOUND,
} from "@appsmith/constants/messages";
import type { DatasourceStructure as DatasourceStructureType } from "entities/Datasource";
import { DatasourceStructureContext } from "entities/Datasource";
import type { ReactElement } from "react";
import React, { memo, useEffect, useState, useContext } from "react";
import EntityPlaceholder from "../Explorer/Entity/Placeholder";
import DatasourceStructure from "./DatasourceStructure";
import { SearchInput, Text } from "design-system";
import { getIsFetchingDatasourceStructure } from "@appsmith/selectors/entitiesSelector";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import ItemLoadingIndicator from "./ItemLoadingIndicator";
import DatasourceStructureNotFound from "./DatasourceStructureNotFound";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { PluginName } from "entities/Action";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { setFeatureWalkthroughShown } from "utils/storage";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import { SCHEMA_SECTION_ID } from "entities/Action";
import { DatasourceStructureSearchContainer } from "./SchemaViewModeCSS";

interface Props {
  datasourceId: string;
  datasourceStructure?: DatasourceStructureType;
  step: number;
  context: DatasourceStructureContext;
  pluginName?: string;
  currentActionId?: string;
  onEntityTableClick?: (table: string) => void;
  tableName?: string;
  customEditDatasourceFn?: () => void;
}

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
  PluginName.OPEN_AI,
];

const Container = (props: Props) => {
  const isLoading = useSelector((state: AppState) =>
    getIsFetchingDatasourceStructure(state, props.datasourceId),
  );
  let view: ReactElement<Props> | JSX.Element = <div />;

  const [datasourceStructure, setDatasourceStructure] = useState<
    DatasourceStructureType | undefined
  >(props.datasourceStructure);

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
          {props.context !== DatasourceStructureContext.EXPLORER && (
            <DatasourceStructureSearchContainer
              className={`t--search-container--${props.context.toLowerCase()}`}
            >
              <SearchInput
                className="datasourceStructure-search"
                endIcon="close"
                onChange={(value) => handleOnChange(value)}
                placeholder={createMessage(
                  DATASOURCE_STRUCTURE_INPUT_PLACEHOLDER_TEXT,
                )}
                size={"sm"}
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
              // If set, then it doesn't set the context menu to generate query from templates
              onEntityTableClick={props.onEntityTableClick}
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
    view = <ItemLoadingIndicator type="SCHEMA" />;
  }

  return view;
};

export const DatasourceStructureContainer = memo(Container);

DatasourceStructureContainer.displayName = "DatasourceStructureContainer";
