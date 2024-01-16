import React from "react";
import { Flex } from "design-system";
import { useCurrentEditorState } from "../hooks";
import { EditorEntityTab } from "@appsmith/entities/IDE/constants";
import { useSelector } from "react-redux";
import type { EntityItem } from "@appsmith/selectors/entitiesSelector";
import {
  selectJSSegmentEditorList,
  selectQuerySegmentEditorList,
} from "@appsmith/selectors/entitiesSelector";
import { JSTab } from "./JSTab";
import { QueryTab } from "./QueryTab";

const FileTabs = () => {
  const { segment } = useCurrentEditorState();

  const files = useSelector((state) => {
    if (segment === EditorEntityTab.JS) {
      return selectJSSegmentEditorList(state);
    } else if (segment === EditorEntityTab.QUERIES) {
      return selectQuerySegmentEditorList(state);
    } else {
      return [];
    }
  });

  // convert files object to array
  const tabs: EntityItem[] = [];
  files.forEach(({ items }) => {
    tabs.push(...items);
  });

  if (segment === EditorEntityTab.UI) {
    return null;
  }

  return (
    <Flex
      className="editor-tabs"
      flex="1"
      gap="spaces-2"
      overflow="hidden"
      paddingBottom="spaces-2"
    >
      {tabs.map((tab: EntityItem) =>
        segment === EditorEntityTab.JS ? (
          <JSTab data={tab} key={tab.key} />
        ) : (
          <QueryTab data={tab} key={tab.key} />
        ),
      )}
    </Flex>
  );
};

export default FileTabs;
