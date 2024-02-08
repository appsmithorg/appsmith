import React from "react";
import { Flex } from "design-system";
import { useCurrentEditorState } from "../hooks";
import { EditorEntityTab } from "@appsmith/entities/IDE/constants";
import { useSelector } from "react-redux";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import {
  selectJSSegmentEditorTabs,
  selectQuerySegmentEditorTabs,
} from "@appsmith/selectors/appIDESelectors";
import { JSTab } from "./JSTab";
import { QueryTab } from "./QueryTab";

const FileTabs = () => {
  const { segment } = useCurrentEditorState();

  const files = useSelector((state) => {
    if (segment === EditorEntityTab.JS) {
      return selectJSSegmentEditorTabs(state);
    } else if (segment === EditorEntityTab.QUERIES) {
      return selectQuerySegmentEditorTabs(state);
    } else {
      return [];
    }
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
      {files.map((tab: EntityItem) =>
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
