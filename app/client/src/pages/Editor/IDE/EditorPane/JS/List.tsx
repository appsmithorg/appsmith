import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Flex, Text, SearchAndAdd } from "@appsmith/ads";
import styled from "styled-components";

import { selectJSSegmentEditorList } from "ee/selectors/appIDESelectors";
import { useActiveActionBaseId } from "ee/pages/Editor/Explorer/hooks";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasCreateActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { ActionParentEntityType } from "ee/entities/Engine/actionHelpers";
import { FilesContextProvider } from "pages/Editor/Explorer/Files/FilesContextProvider";
import { useJSAdd } from "ee/pages/Editor/IDE/EditorPane/JS/hooks";
import { JSListItem } from "ee/pages/Editor/IDE/EditorPane/JS/ListItem";
import { BlankState } from "./BlankState";
import { EmptySearchResult } from "../components/EmptySearchResult";
import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";
import { filterEntityGroupsBySearchTerm } from "IDE/utils";

const JSContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;
  }
`;

const ListJSObjects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const pageId = useSelector(getCurrentPageId);
  const itemGroups = useSelector(selectJSSegmentEditorList);
  const activeActionBaseId = useActiveActionBaseId();
  const applicationId = useSelector(getCurrentApplicationId);

  const pagePermissions = useSelector(getPagePermissions);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const filteredItemGroups = filterEntityGroupsBySearchTerm(
    searchTerm,
    itemGroups,
  );

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const { openAddJS } = useJSAdd();

  return (
    <JSContainer
      className="ide-editor-left-pane__content-js"
      flex="1"
      flexDirection="column"
      gap="spaces-3"
      overflow="hidden"
      px="spaces-3"
      py="spaces-3"
    >
      {itemGroups && itemGroups.length > 0 ? (
        <SearchAndAdd
          onAdd={openAddJS}
          onSearch={setSearchTerm}
          showAddButton={canCreateActions}
        />
      ) : null}
      <FilesContextProvider
        canCreateActions={canCreateActions}
        editorId={applicationId}
        parentEntityId={pageId}
        parentEntityType={ActionParentEntityType.PAGE}
      >
        <Flex
          data-testid="t--ide-list"
          flexDirection="column"
          gap="spaces-4"
          overflowY="auto"
        >
          {filteredItemGroups.map(({ group, items }) => {
            return (
              <Flex flexDirection={"column"} key={group}>
                {group !== "NA" ? (
                  <Flex py="spaces-1">
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
                        isActive={item.key === activeActionBaseId}
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
          {filteredItemGroups.length === 0 && searchTerm !== "" ? (
            <EmptySearchResult
              type={createMessage(EDITOR_PANE_TEXTS.search_objects.jsObject)}
            />
          ) : null}
        </Flex>
      </FilesContextProvider>

      {(!itemGroups || itemGroups.length === 0) && <BlankState />}
    </JSContainer>
  );
};

export default ListJSObjects;
