import React from "react";
import { useSelector } from "react-redux";
import { Button, Flex, Text } from "design-system";
import styled from "styled-components";

import { selectJSSegmentEditorList } from "@appsmith/selectors/appIDESelectors";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import { ActionParentEntityType } from "@appsmith/entities/Engine/actionHelpers";
import { FilesContextProvider } from "pages/Editor/Explorer/Files/FilesContextProvider";
import { useJSAdd } from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";
import { JSListItem } from "@appsmith/pages/Editor/IDE/EditorPane/JS/ListItem";
import { BlankState } from "./BlankState";

const JSContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const ListJSObjects = () => {
  const pageId = useSelector(getCurrentPageId);
  const jsList = useSelector(selectJSSegmentEditorList);
  const activeActionId = useActiveAction();
  const applicationId = useSelector(getCurrentApplicationId);

  const pagePermissions = useSelector(getPagePermissions);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const addButtonClickHandler = useJSAdd();

  return (
    <JSContainer
      className="ide-editor-left-pane__content-js"
      flexDirection="column"
      gap="spaces-3"
      overflow="hidden"
      py="spaces-3"
    >
      {jsList && jsList.length > 0 && canCreateActions && (
        <Flex flexDirection="column" px="spaces-3">
          <Button
            className="t--add-item"
            kind={"secondary"}
            onClick={addButtonClickHandler}
            size={"sm"}
            startIcon={"add-line"}
          >
            {createMessage(EDITOR_PANE_TEXTS.js_add_button)}
          </Button>
        </Flex>
      )}
      <FilesContextProvider
        canCreateActions={canCreateActions}
        editorId={applicationId}
        parentEntityId={pageId}
        parentEntityType={ActionParentEntityType.PAGE}
      >
        <Flex
          data-testid="t--ide-list"
          flex="1"
          flexDirection="column"
          gap="spaces-4"
          overflowY="auto"
          px="spaces-3"
        >
          {jsList.map(({ group, items }) => {
            return (
              <Flex flexDirection={"column"} key={group}>
                {group !== "NA" ? (
                  <Flex px="spaces-3" py="spaces-1">
                    <Text
                      className="overflow-hidden overflow-ellipsis whitespace-nowrap"
                      kind="body-s"
                    >
                      {group}
                    </Text>
                  </Flex>
                ) : null}
                <>
                  {items.map((item) => {
                    return (
                      <JSListItem
                        isActive={item.key === activeActionId}
                        item={item}
                        key={item.key}
                        parentEntityId={pageId}
                        parentEntityType={ActionParentEntityType.PAGE}
                      />
                    );
                  })}
                </>
              </Flex>
            );
          })}
        </Flex>
      </FilesContextProvider>

      {(!jsList || jsList.length === 0) && <BlankState />}
    </JSContainer>
  );
};

export default ListJSObjects;
