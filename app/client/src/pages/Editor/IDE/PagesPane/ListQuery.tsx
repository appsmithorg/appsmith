import React, { useCallback } from "react";
import { Button, Flex, Text } from "design-system";
import { useSelector } from "react-redux";

import ExplorerActionEntity from "pages/Editor/Explorer/Actions/ActionEntity";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import { getPagePermissions } from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import history from "utils/history";
import {
  getCurrentPageId,
  selectQueriesForPagespane,
} from "@appsmith/selectors/entitiesSelector";
import { ADD_PATH } from "constants/routes";

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

  const addButtonClickHandler = useCallback(() => {
    history.push(`${location.pathname}${ADD_PATH}`);
  }, [pageId]);

  return (
    <Flex flexDirection="column" padding="spaces-4">
      {canCreateActions && (
        <Button
          kind={"secondary"}
          onClick={addButtonClickHandler}
          size={"sm"}
          startIcon={"add-line"}
        >
          New query/API
        </Button>
      )}

      {Object.keys(files).map((key) => {
        return (
          <Flex flexDirection={"column"} key={key}>
            <Flex px="spaces-3">
              <Text
                className="overflow-hidden overflow-ellipsis whitespace-nowrap"
                kind="heading-xs"
              >
                {key}
              </Text>
            </Flex>
            {files[key].map((file: any) => {
              return (
                <ExplorerActionEntity
                  id={file.id}
                  isActive={file.id === activeActionId}
                  key={file.id}
                  searchKeyword={""}
                  step={2}
                  type={file.type}
                />
              );
            })}
          </Flex>
        );
      })}

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
    </Flex>
  );
};

export { ListQuery };
