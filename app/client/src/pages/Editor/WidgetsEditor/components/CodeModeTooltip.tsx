import { Tooltip } from "design-system";
import React, { useEffect, useState } from "react";
import { modText } from "utils/helpers";
import { useSelector } from "react-redux";
import { getWidgetSelectionBlock } from "selectors/ui";
import { retrieveCodeWidgetNavigationUsed } from "utils/storage";

const CodeModeTooltip = (props: { children: React.ReactElement }) => {
  const isWidgetSelectionBlock = useSelector(getWidgetSelectionBlock);
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
  return (
    <Tooltip
      content={`💡 ${modText()} click a widget to navigate to UI mode.`}
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
