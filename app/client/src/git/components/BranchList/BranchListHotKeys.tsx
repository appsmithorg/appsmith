import React, { useMemo } from "react";
import { useHotkeys } from "@blueprintjs/core";

interface Props {
  handleUpKey: () => void;
  handleDownKey: () => void;
  handleSubmitKey: () => void;
  handleEscKey: () => void;
  children: React.ReactNode;
}

function BranchListHotKeys(props: Props) {
  const hotkeys = useMemo(
    () => [
      {
        combo: "up",
        onKeyDown: props.handleUpKey,
        global: false,
        allowInInput: true,
        group: "Branches",
        label: "Move up the list",
      },
      {
        combo: "down",
        onKeyDown: props.handleDownKey,
        global: false,
        allowInInput: true,
        group: "Branches",
        label: "Move down the list",
      },
      {
        combo: "return",
        onKeyDown: props.handleSubmitKey,
        global: false,
        allowInInput: true,
        group: "Branches",
        label: "Submit",
      },
      {
        combo: "esc",
        onKeyDown: props.handleEscKey,
        global: false,
        allowInInput: true,
        group: "Branches",
        label: "ESC",
      },
    ],
    [
      props.handleUpKey,
      props.handleDownKey,
      props.handleSubmitKey,
      props.handleEscKey,
    ],
  );

  const { handleKeyDown, handleKeyUp } = useHotkeys(hotkeys);

  return (
    <div
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        minHeight: 0,
        overflow: "auto",
      }}
    >
      {props.children}
    </div>
  );
}

export default BranchListHotKeys;
