import React, { useState } from "react";
import {
  EntityGroupsList,
  Flex,
  type FlexProps,
  type ListItemProps,
  SearchInput,
  Text,
} from "@appsmith/ads";
import { JSONViewer, Size } from "components/editorComponents/JSONViewer";
import { filterEntityGroupsBySearchTerm } from "IDE/utils";
import { useStateInspectorItems, useGetDisplayData } from "./hooks";
import * as Styled from "./styles";

const GroupListPadding = {
  pl: "spaces-3",
  pr: "spaces-3",
} as FlexProps;

export const StateInspector = () => {
  const [selectedItem, items] = useStateInspectorItems();
  const selectedItemCode = useGetDisplayData(selectedItem?.title || "");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItemGroups = filterEntityGroupsBySearchTerm<
    { group: string },
    ListItemProps
  >(searchTerm, items);

  return (
    <Flex h="calc(100% - 40px)" overflow="hidden" w="100%">
      <Flex
        borderRight="1px solid var(--ads-v2-color-border)"
        flexDirection="column"
        h="100%"
        overflowY="hidden"
        w="400px"
      >
        <Flex p="spaces-3">
          <SearchInput
            onChange={setSearchTerm}
            placeholder="Search entities"
            value={searchTerm}
          />
        </Flex>
        <EntityGroupsList
          flexProps={GroupListPadding}
          groups={filteredItemGroups.map((item) => {
            return {
              groupTitle: item.group,
              items: item.items,
              className: "",
            };
          })}
        />
      </Flex>
      {selectedItem ? (
        <Flex
          className="as-mask"
          data-testid="t--selected-entity-details"
          flex="1"
          flexDirection="column"
          overflowY="hidden"
        >
          <Styled.SelectedItem
            alignItems="center"
            flexDirection="row"
            gap="spaces-2"
            p="spaces-3"
          >
            {selectedItem.icon}
            <Text kind="body-m">{selectedItem.title}</Text>
          </Styled.SelectedItem>
          <Flex className="as-mask" overflowY="auto" px="spaces-3">
            <JSONViewer size={Size.MEDIUM} src={selectedItemCode} />
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
};
