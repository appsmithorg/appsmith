import React, { useCallback } from "react";
import { Button, Flex, Text } from "design-system";
import { useSelector } from "react-redux";

import ExplorerActionEntity from "pages/Editor/Explorer/Actions/ActionEntity";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import {
  getCurrentApplicationId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import history from "utils/history";
import {
  getCurrentPageId,
  selectQueriesForPagespane,
} from "@appsmith/selectors/entitiesSelector";
import { ADD_PATH } from "constants/routes";
import { ActionParentEntityType } from "@appsmith/entities/Engine/actionHelpers";
import { FilesContextProvider } from "pages/Editor/Explorer/Files/FilesContextProvider";
import { createMessage, PAGES_PANE_TEXTS } from "@appsmith/constants/messages";

const ListQuery = () => {
  const pageId = useSelector(getCurrentPageId) as string;
  const files = useSelector(selectQueriesForPagespane);
  const activeActionId = useActiveAction();
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );
  const applicationId = useSelector(getCurrentApplicationId);

  const addButtonClickHandler = useCallback(() => {
    history.push(`${location.pathname}${ADD_PATH}`);
  }, [pageId]);

  return (
    <Flex flexDirection="column" overflow="hidden">
      <Flex
        flex="1"
        flexDirection={"column"}
        gap="spaces-3"
        overflow="scroll"
        padding="spaces-3"
      >
        {Object.keys(files).map((key) => {
          return (
            <Flex flexDirection={"column"} gap="spaces-2" key={key}>
              <Flex px="spaces-3" py="spaces-1">
                <Text
                  className="overflow-hidden overflow-ellipsis whitespace-nowrap"
                  kind="body-s"
                >
                  {key}
                </Text>
              </Flex>
              <FilesContextProvider
                canCreateActions={canCreateActions}
                editorId={applicationId}
                parentEntityId={pageId}
                parentEntityType={ActionParentEntityType.PAGE}
              >
                {files[key].map((file: any) => {
                  return (
                    <ExplorerActionEntity
                      id={file.id}
                      isActive={file.id === activeActionId}
                      key={file.id}
                      parentEntityId={pageId}
                      parentEntityType={ActionParentEntityType.PAGE}
                      searchKeyword={""}
                      step={1}
                      type={file.type}
                    />
                  );
                })}
              </FilesContextProvider>
            </Flex>
          );
        })}
      </Flex>

      {Object.keys(files).length === 0 && (
        <Flex px="spaces-3">
          <Text
            className="overflow-hidden overflow-ellipsis whitespace-nowrap"
            kind="heading-xs"
          >
            No queries to display
          </Text>
        </Flex>
      )}
      {canCreateActions && (
        <Flex flexDirection="column" padding="spaces-3">
          <Button
            kind={"secondary"}
            onClick={addButtonClickHandler}
            size={"sm"}
            startIcon={"add-line"}
          >
            {createMessage(PAGES_PANE_TEXTS.query_add_button)}
          </Button>
        </Flex>
      )}
    </Flex>
  );
};

export { ListQuery };
