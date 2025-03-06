import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Flex,
  Text,
  SearchAndAdd,
  NoSearchResults,
  EntityGroupsList,
} from "@appsmith/ads";
import styled from "styled-components";

import { selectJSSegmentEditorList } from "ee/selectors/appIDESelectors";
import { useActiveActionBaseId } from "ee/pages/Editor/Explorer/hooks";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { ActionParentEntityType } from "ee/entities/Engine/actionHelpers";
import { FilesContextProvider } from "pages/Editor/Explorer/Files/FilesContextProvider";
import { useJSAdd } from "../JSAdd";
import { JSListItem } from "ee/pages/AppIDE/components/JSListItem/old/ListItem";
import { BlankState } from "./BlankState";
import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";
import { filterEntityGroupsBySearchTerm } from "IDE/utils";
import { useLocation } from "react-router";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";
import { useParentEntityInfo } from "ee/IDE/hooks/useParentEntityInfo";
import { JSEntity } from "ee/pages/AppIDE/components/JSListItem/ListItem";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";
import { getPagePermissions } from "selectors/editorSelectors";
import { getHasCreateActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";

const JSContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;
  }
`;

export const ListJSObjects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const itemGroups = useSelector(selectJSSegmentEditorList);
  const activeActionBaseId = useActiveActionBaseId();

  const location = useLocation();
  const ideType = getIDETypeByUrl(location.pathname);
  const { editorId, parentEntityId } = useParentEntityInfo(ideType);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const pagePermissions = useSelector(getPagePermissions);
  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const isNewADSTemplatesEnabled = useFeatureFlag(
    FEATURE_FLAG.release_ads_entity_item_enabled,
  );

  const filteredItemGroups = filterEntityGroupsBySearchTerm(
    searchTerm,
    itemGroups,
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
      {(!itemGroups || itemGroups.length === 0) && <BlankState />}

      {itemGroups && itemGroups.length > 0 ? (
        <SearchAndAdd
          onAdd={openAddJS}
          onSearch={setSearchTerm}
          showAddButton={canCreateActions}
        />
      ) : null}
      <Flex
        data-testid="t--ide-list"
        flexDirection="column"
        gap="spaces-3"
        overflowY="auto"
      >
        {isNewADSTemplatesEnabled ? (
          <EntityGroupsList
            groups={filteredItemGroups.map(({ group, items }) => {
              return {
                groupTitle: group === "NA" ? "" : group,
                items: items,
                className: "",
                renderList: (item: EntityItem) => {
                  return <JSEntity item={item} />;
                },
              };
            })}
          />
        ) : (
          filteredItemGroups.map(({ group, items }) => {
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
                <FilesContextProvider
                  canCreateActions={canCreateActions}
                  editorId={editorId}
                  parentEntityId={parentEntityId}
                  parentEntityType={ActionParentEntityType.PAGE}
                >
                  {items.map((item) => {
                    return (
                      <JSListItem
                        isActive={item.key === activeActionBaseId}
                        item={item}
                        key={item.key}
                        parentEntityId={parentEntityId}
                      />
                    );
                  })}
                </FilesContextProvider>
              </Flex>
            );
          })
        )}
        {filteredItemGroups.length === 0 && searchTerm !== "" ? (
          <NoSearchResults
            text={createMessage(
              EDITOR_PANE_TEXTS.empty_search_result,
              createMessage(EDITOR_PANE_TEXTS.search_objects.jsObject),
            )}
          />
        ) : null}
      </Flex>
    </JSContainer>
  );
};
