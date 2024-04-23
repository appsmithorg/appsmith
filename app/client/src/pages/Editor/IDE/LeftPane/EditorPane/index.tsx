import React, { useEffect } from "react";
import { Flex } from "design-system";
import { useEditorPaneWidth } from "../../hooks";
import { getIDEViewMode } from "selectors/ideSelectors";
import { useSelector } from "react-redux";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import { SegmentedLists } from "./SegmentedLists";
import { CodeTabs } from "./CodeTabs";
import { animated, useSpring } from "react-spring";
import { DEFAULT_EDITOR_PANE_WIDTH } from "constants/AppConstants";

export const EditorPane = () => {
  const width = useEditorPaneWidth();
  const editorMode = useSelector(getIDEViewMode);
  const AnimatedFlex = animated(Flex);
  const [springs, api] = useSpring(() => ({
    from: { width: DEFAULT_EDITOR_PANE_WIDTH + "px" },
    config: {
      duration: 375,
      mass: 1,
      tension: 205,
      friction: 32,
    },
  }));

  useEffect(() => {
    api.start({ to: { width } });

    return () => {
      api.stop();
    };
  }, [width, api]);

  return (
    <AnimatedFlex
      className="ide-editor-left-pane"
      flexDirection={
        editorMode === EditorViewMode.SplitScreen ? "column" : "row"
      }
      gap="spacing-2"
      height="100%"
      overflow="hidden"
      style={springs}
    >
      <SegmentedLists />
      <CodeTabs />
    </AnimatedFlex>
  );
};
