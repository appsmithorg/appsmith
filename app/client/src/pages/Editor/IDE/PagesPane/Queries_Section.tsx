import React from "react";
import { useSelector } from "react-redux";
import { Flex, Text } from "design-system";
import styled from "styled-components";

// import { getPagePermissions } from "selectors/editorSelectors";
import { selectFilesForExplorer } from "@appsmith/selectors/entitiesSelector";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import ExplorerActionEntity from "pages/Editor/Explorer/Actions/ActionEntity";
// import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
// import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
// import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";

const QueriesContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 4px auto 1fr auto auto auto auto auto;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const QueriesSection = () => {
  const files = useSelector(selectFilesForExplorer);
  const activeActionId = useActiveAction();
  // const pagePermissions = useSelector(getPagePermissions);
  // const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  // const canCreateActions = getHasCreateActionPermission(
  //   isFeatureEnabled,
  //   pagePermissions,
  // );

  return (
    <QueriesContainer
      className="ide-pages-pane__content-queries"
      flexDirection="column"
      paddingTop="spaces-3"
    >
      {files.map(({ entity, type }: any) => {
        if (type === "group" && entity.name !== "JS Objects") {
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
        } else if (type !== "JS" && entity.id) {
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
        }
      })}

      {files.length === 0 && (
        <Flex px="spaces-3">
          <Text
            className="overflow-hidden overflow-ellipsis whitespace-nowrap"
            kind="heading-xs"
          >
            No Queries/APIs found
          </Text>
        </Flex>
      )}
    </QueriesContainer>
  );
};

export { QueriesSection };
