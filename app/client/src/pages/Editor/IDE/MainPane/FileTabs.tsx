import React from "react";
import { Button, Flex } from "design-system";
import { useCurrentEditorState } from "../hooks";
import { EditorEntityTab, EditorViewMode } from "entities/IDE/constants";
import { useDispatch, useSelector } from "react-redux";
import { setIdeEditorViewMode } from "actions/ideActions";
import type { PagePaneDataObject } from "@appsmith/selectors/entitiesSelector";
import {
  selectJSForPagespane,
  selectQueriesForPagespane,
} from "@appsmith/selectors/entitiesSelector";
import { JSTab } from "./JSTab";
import { QueryTab } from "./QueryTab";

const FileTabs = () => {
  const dispatch = useDispatch();
  const { segment } = useCurrentEditorState();

  const files = useSelector((state) => {
    if (segment === EditorEntityTab.JS) {
      return selectJSForPagespane(state);
    } else if (segment === EditorEntityTab.QUERIES) {
      return selectQueriesForPagespane(state);
    } else {
      return {};
    }
  });

  // convert files object to array
  const tabs: PagePaneDataObject[] = [];
  Object.keys(files).forEach((key) => {
    tabs.push(...files[key]);
  });

  if (segment === EditorEntityTab.UI) {
    return null;
  }

  return (
    <Flex
      backgroundColor="#F8FAFC"
      borderBottom="#F1F5F9"
      gap="spaces-2"
      padding="spaces-2"
      width="100%"
    >
      <Flex
        className="editor-tabs"
        flex="1"
        gap="spaces-2"
        overflow="hidden"
        paddingBottom="spaces-2"
      >
        {tabs.map((tab: PagePaneDataObject) =>
          segment === EditorEntityTab.JS ? (
            <JSTab data={tab} key={tab.id} />
          ) : (
            <QueryTab data={tab} key={tab.id} />
          ),
        )}
      </Flex>
      <Button
        isIconButton
        kind="tertiary"
        onClick={() =>
          dispatch(setIdeEditorViewMode(EditorViewMode.HalfScreen))
        }
        startIcon="icon-align-left"
      />
    </Flex>
  );
};

export default FileTabs;
