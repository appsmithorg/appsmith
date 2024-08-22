import React, { useEffect, useState } from "react";

import { CANVAS_VIEW_MODE_TOOLTIP, createMessage } from "ee/constants/messages";
import { EditorState } from "ee/entities/IDE/constants";
import { useCurrentAppState } from "pages/Editor/IDE/hooks";
import { useSelector } from "react-redux";
import { getWidgetSelectionBlock } from "selectors/ui";
import { modText } from "utils/helpers";
import { retrieveCodeWidgetNavigationUsed } from "utils/storage";

import { Tooltip } from "@appsmith/ads";

/**
 * CodeModeTooltip
 *
 * This component is used to display a tooltip when the user hovers over a widget in code mode(when js pane and widgets editor are side by side).
 */

const CodeModeTooltip = (props: { children: React.ReactElement }) => {
  const isWidgetSelectionBlock = useSelector(getWidgetSelectionBlock);
  const editorState = useCurrentAppState();
  const [shouldShow, setShouldShow] = useState<boolean>(false);
  useEffect(() => {
    retrieveCodeWidgetNavigationUsed()
      .then((timesUsed) => {
        if (timesUsed < 2) {
          setShouldShow(true);
        }
      })
      .catch(() => {
        setShouldShow(true);
      });
  }, [isWidgetSelectionBlock]);
  if (!isWidgetSelectionBlock) return props.children;
  if (editorState !== EditorState.EDITOR) return props.children;
  return (
    <Tooltip
      content={createMessage(CANVAS_VIEW_MODE_TOOLTIP, `${modText()}`)}
      isDisabled={!shouldShow}
      placement={"bottom"}
      showArrow={false}
      trigger={"hover"}
    >
      {props.children}
    </Tooltip>
  );
};

export default CodeModeTooltip;
