import React from "react";
import { Flex, List, SearchInput, Text } from "@appsmith/ads";
import { useStateInspectorItems } from "./hooks";
import { getConfigTree, getDataTree } from "selectors/dataTreeSelectors";
import { useSelector } from "react-redux";
import ReactJson from "react-json-view";
import { getJSCollections } from "ee/selectors/entitiesSelector";
import { filterInternalProperties } from "utils/FilterInternalProperties";

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
  const dataTree = useSelector(getDataTree);
  const configTree = useSelector(getConfigTree);
  const jsActions = useSelector(getJSCollections);

  const filteredData = filterInternalProperties(
    selectedItem.title,
    dataTree[selectedItem.title],
    jsActions,
    dataTree,
    configTree,
  );

  return (
    <Flex h="100%" overflow="hidden" w="100%">
      <Flex
        borderRight="1px solid var(--ads-v2-color-border)"
        flexDirection="column"
        gap="spaces-3"
        h="100%"
        overflowY="hidden"
        p="spaces-3"
        w="400px"
      >
        <SearchInput />
        <Flex
          flexDirection="column"
          height="calc(100% - 64px)"
          overflowY="auto"
        >
          {items.map((item) => (
            <Flex flexDirection="column" gap="spaces-2" key={item.group}>
              <Text
                className="overflow-hidden overflow-ellipsis whitespace-nowrap flex-shrink-0"
                kind="body-s"
              >
                {item.group}
              </Text>
              <List items={item.items} />
            </Flex>
          ))}
        </Flex>
      </Flex>
      <Flex flex="1" height="calc(100% - 40px)" overflowY="auto" p="spaces-3">
        <ReactJson src={filteredData} {...reactJsonProps} />
      </Flex>
    </Flex>
  );
};
