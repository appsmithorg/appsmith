import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "design-system";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import {
  EditorEntityTab,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { setIdeEditorViewMode } from "actions/ideActions";
import FileTabs from "./FileTabs";
import Container from "./Container";
import { useCurrentEditorState } from "../hooks";

const FullScreenTabs = () => {
  const dispatch = useDispatch();
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment } = useCurrentEditorState();
  const setSplitScreenMode = useCallback(() => {
    dispatch(setIdeEditorViewMode(EditorViewMode.SplitScreen));
  }, []);
  if (!isSideBySideEnabled) return null;
  if (ideViewMode === EditorViewMode.SplitScreen) return null;
  if (segment === EditorEntityTab.UI) return null;
  return (
    <Container>
      <FileTabs />
      <Button
        isIconButton
        kind="tertiary"
        onClick={setSplitScreenMode}
        startIcon="icon-align-left"
      />
    </Container>
  );
};

export default FullScreenTabs;
