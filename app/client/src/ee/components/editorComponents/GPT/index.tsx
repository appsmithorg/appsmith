export * from "ce/components/editorComponents/GPT";

import React from "react";
import { AskAI } from "./AskAI";
import { useSelector } from "react-redux";
import classNames from "classnames";
import { selectIsAIWindowOpen } from "./utils";
import type { TAIWrapperProps } from "ce/components/editorComponents/GPT";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";

export function AIWindow(props: TAIWrapperProps) {
  const { windowType } = props;
  if (windowType === "popover") {
    return <FloatingAIWindow {...props} />;
  } else {
    return <FixedAIWindow {...props} />;
  }
}

function FixedAIWindow(props: TAIWrapperProps) {
  const { className } = props;
  const isAIWindowOpen = useSelector(selectIsAIWindowOpen);
  return (
    <div
      className={classNames({
        "h-full w-[400px]": true,
        [className || ""]: true,
        hidden: !isAIWindowOpen,
      })}
    >
      <AskAI />
    </div>
  );
}

function FloatingAIWindow(props: TAIWrapperProps) {
  const isAIWindowOpen = useSelector(selectIsAIWindowOpen);
  const propertyPaneWidth = useSelector(getPropertyPaneWidth);
  const BORDER_OFFSET = 1;
  return (
    <div className="relative">
      <div
        className={classNames({
          "h-[500px] w-[400px] overflow-hidden absolute bottom-0": true,
          hidden: !isAIWindowOpen,
          " bg-white bp3-popover": isAIWindowOpen,
        })}
        style={{ right: propertyPaneWidth + BORDER_OFFSET + "px" }}
      >
        <AskAI />
      </div>
      {props.children}
    </div>
  );
}
