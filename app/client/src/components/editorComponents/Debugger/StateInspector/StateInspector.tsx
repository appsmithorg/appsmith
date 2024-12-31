import React, { useState } from "react";
import { Flex, List, SearchInput, Text } from "@appsmith/ads";
import { useStateInspectorItems } from "./hooks";
import { getConfigTree, getDataTree } from "selectors/dataTreeSelectors";
import { useSelector } from "react-redux";
import ReactJson from "react-json-view";
import { getJSCollections } from "ee/selectors/entitiesSelector";
import { filterInternalProperties } from "utils/FilterInternalProperties";
import * as Styled from "./styles";
import { filterEntityGroupsBySearchTerm } from "IDE/utils";

export const reactJsonProps = {
  name: null,
  enableClipboard: false,
  displayDataTypes: false,
  displayArrayKey: true,
  quotesOnKeys: false,
  style: {
    fontSize: "12px",
  },
  collapsed: 1,
  indentWidth: 2,
  collapseStringsAfterLength: 30,
};

export const StateInspector = () => {
  const [selectedItem, items] = useStateInspectorItems();
  const [searchTerm, setSearchTerm] = useState("");
  const dataTree = useSelector(getDataTree);
  const configTree = useSelector(getConfigTree);
  const jsActions = useSelector(getJSCollections);

  let filteredData: unknown = "";

  if (selectedItem.title in dataTree) {
    filteredData = filterInternalProperties(
      selectedItem.title,
      dataTree[selectedItem.title],
      jsActions,
      dataTree,
      configTree,
    );
  }

  const filteredItemGroups = filterEntityGroupsBySearchTerm(searchTerm, items);

  return (
    <Flex h="calc(100% - 40px)" overflow="hidden" w="100%">
      <Flex
        borderRight="1px solid var(--ads-v2-color-border)"
        flexDirection="column"
        gap="spaces-3"
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
        <Flex
          flexDirection="column"
          gap="spaces-3"
          overflowY="auto"
          p="spaces-3"
        >
          {filteredItemGroups.map((item) => (
            <Styled.Group
              flexDirection="column"
              gap="spaces-2"
              key={item.group}
            >
              <Text
                className="overflow-hidden overflow-ellipsis whitespace-nowrap flex-shrink-0"
                kind="body-s"
              >
                {item.group}
              </Text>
              <List items={item.items} />
            </Styled.Group>
          ))}
        </Flex>
      </Flex>
      <Flex
        className="mp-mask"
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
        <Flex overflowY="auto" px="spaces-3">
          <ReactJson src={filteredData} {...reactJsonProps} />
        </Flex>
      </Flex>
    </Flex>
  );
};
