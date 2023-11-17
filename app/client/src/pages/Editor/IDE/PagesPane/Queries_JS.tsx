import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Flex, Text } from "design-system";
import styled from "styled-components";

import { getPagePermissions } from "selectors/editorSelectors";
import { selectFilesForExplorer } from "@appsmith/selectors/entitiesSelector";
import { useActiveAction } from "pages/Editor/Explorer/hooks";
import ExplorerActionEntity from "pages/Editor/Explorer/Actions/ActionEntity";
import { EmptyComponent } from "pages/Editor/Explorer/common";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import {
  createMessage,
  EMPTY_QUERY_JS_BUTTON_TEXT,
  EMPTY_QUERY_JS_MAIN_TEXT,
} from "@appsmith/constants/messages";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import ExplorerJSCollectionEntity from "pages/Editor/Explorer/JSActions/JSActionEntity";

const QueriesContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 4px auto 1fr auto auto auto auto auto;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const QueriesJS = ({ paneType }: { paneType: "queries" | "js" }) => {
  const files = useSelector(selectFilesForExplorer);
  const activeActionId = useActiveAction();
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const fileEntities = useMemo(
    () =>
      files.map(({ entity, type }: any) => {
        if (
          paneType !== "js" &&
          type === "group" &&
          entity.name === "JS Objects"
        ) {
          return (
            <Flex key={entity.name || "Queries"} px="spaces-3">
              <Text
                className="overflow-hidden overflow-ellipsis whitespace-nowrap"
                kind="heading-xs"
              >
                {entity.name}
              </Text>
            </Flex>
          );
        } else if (type !== "JS" && paneType === "queries") {
          return (
            <ExplorerActionEntity
              id={entity.id}
              isActive={entity.id === activeActionId}
              key={entity.id}
              searchKeyword={""}
              step={2}
              type={type}
            />
          );
        } else if (type === "JS" && paneType === "js") {
          return (
            <ExplorerJSCollectionEntity
              id={entity.id}
              isActive={entity.id === activeActionId}
              key={entity.id}
              searchKeyword={""}
              step={2}
              type={type}
            />
          );
        }
      }),
    [files, activeActionId],
  );

  return (
    <QueriesContainer
      className="ide-pages-pane__content-queries"
      flexDirection="column"
      paddingTop="spaces-3"
    >
      {fileEntities.length ? (
        fileEntities
      ) : (
        <EmptyComponent
          mainText={createMessage(EMPTY_QUERY_JS_MAIN_TEXT)}
          {...(canCreateActions && {
            addBtnText: createMessage(EMPTY_QUERY_JS_BUTTON_TEXT),
            // addFunction: onCreate,
          })}
        />
      )}
    </QueriesContainer>
  );
};

export { QueriesJS };
