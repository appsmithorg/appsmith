import React from "react";
import FileTabs from "./FileTabs";
import { useSelector } from "react-redux";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import { Button } from "design-system";
import Container from "./Container";
import { useCurrentEditorState } from "../hooks";
import { EditorEntityTab, EditorViewMode } from "entities/IDE/constants";

const SplitScreenTabs = () => {
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment } = useCurrentEditorState();
  if (!isSideBySideEnabled) return null;
  if (ideViewMode === EditorViewMode.FullScreen) return null;
  if (segment === EditorEntityTab.UI) return null;
  return (
    <Container>
      <Button isIconButton kind={"secondary"} startIcon={"add-line"} />
      <FileTabs />
      <Button isIconButton kind="secondary" startIcon={"chevron-down"} />
    </Container>
  );
};

export default SplitScreenTabs;
