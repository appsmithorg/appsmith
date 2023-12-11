import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Flex, Text } from "design-system";
import styled from "styled-components";

import { selectJSForPagespane } from "@appsmith/selectors/entitiesSelector";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import ExplorerJSCollectionEntity from "pages/Editor/Explorer/JSActions/JSActionEntity";
import type { PluginType } from "entities/Action";
import {
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { createNewJSCollection } from "actions/jsPaneActions";

const JSContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 4px auto 1fr auto auto auto auto auto;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const JSSection = () => {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId);
  const files = useSelector(selectJSForPagespane);
  const JSObjects = files["JS Objects"];
  const activeActionId = useActiveAction();

  const pagePermissions = useSelector(getPagePermissions);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const addButtonClickHandler = () => {
    dispatch(createNewJSCollection(pageId, "JS_OBJECT_GUTTER_RUN_BUTTON"));
  };

  return (
    <JSContainer
      className="ide-pages-pane__content-queries"
      flexDirection="column"
      gap="spaces-3"
      overflow="scroll"
      padding="spaces-4"
    >
      {canCreateActions && (
        <Button
          kind={"secondary"}
          onClick={addButtonClickHandler}
          size={"sm"}
          startIcon={"add-line"}
        >
          New JS object
        </Button>
      )}
      {JSObjects &&
        JSObjects.map((JSobject) => {
          return (
            <Flex flexDirection={"column"} key={JSobject.id}>
              <ExplorerJSCollectionEntity
                id={JSobject.id}
                isActive={JSobject.id === activeActionId}
                key={JSobject.id}
                searchKeyword={""}
                step={2}
                type={JSobject.type as PluginType}
              />
            </Flex>
          );
        })}

      {!JSObjects ||
        (JSObjects.length === 0 && (
          <Flex px="spaces-3">
            <Text
              className="overflow-hidden overflow-ellipsis whitespace-nowrap"
              kind="heading-xs"
            >
              No JS objects to display
            </Text>
          </Flex>
        ))}
    </JSContainer>
  );
};

export { JSSection };
