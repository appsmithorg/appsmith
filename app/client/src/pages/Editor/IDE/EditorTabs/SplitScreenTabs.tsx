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
} from "@appsmith/entities/IDE/constants";
import { useJSAdd } from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";
import { useQueryAdd } from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";

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
    </Container>
  );
};

export default SplitScreenTabs;
