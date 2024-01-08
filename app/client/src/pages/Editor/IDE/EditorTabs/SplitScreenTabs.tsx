import React, { useCallback } from "react";
import FileTabs from "./FileTabs";
import { useSelector } from "react-redux";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import { Button } from "design-system";
import Container from "./Container";
import { useCurrentEditorState } from "../hooks";
import {
  EditorEntityTab,
  EditorEntityTabState,
  EditorViewMode,
} from "entities/IDE/constants";
import { useJSAdd, useJSList } from "../EditorPane/JS/hooks";
import { useQueryAdd, useQueryList } from "../EditorPane/Query/hooks";

const SplitScreenTabs = () => {
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment, segmentMode } = useCurrentEditorState();

  const onJSAddClick = useJSAdd();
  const onQueryAddClick = useQueryAdd();
  const onAddClick = useCallback(() => {
    if (segmentMode === EditorEntityTabState.Add) return;
    if (segment === EditorEntityTab.JS) onJSAddClick();
    if (segment === EditorEntityTab.QUERIES) onQueryAddClick();
  }, [segment, segmentMode]);

  const onJSListClick = useJSList();
  const onQueryListClick = useQueryList();
  const onMoreClick = useCallback(() => {
    if (segmentMode === EditorEntityTabState.List) return;
    if (segment === EditorEntityTab.JS) onJSListClick();
    if (segment === EditorEntityTab.QUERIES) onQueryListClick();
  }, [segment, segmentMode]);

  if (!isSideBySideEnabled) return null;
  if (ideViewMode === EditorViewMode.FullScreen) return null;
  if (segment === EditorEntityTab.UI) return null;
  return (
    <Container>
      <Button
        isIconButton
        kind={"secondary"}
        onClick={onAddClick}
        startIcon={"add-line"}
      />
      <FileTabs />
      <Button
        isIconButton
        kind="tertiary"
        onClick={onMoreClick}
        startIcon={"arrow-down-s-line"}
      />
    </Container>
  );
};

export default SplitScreenTabs;
