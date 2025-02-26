import React from "react";
import { useHotkeys } from "@blueprintjs/core";

interface Props {
  handleUpKey: () => void;
  handleDownKey: () => void;
  handleSubmitKey: () => void;
  handleEscKey: () => void;
  children: React.ReactNode;
}

function BranchListHotKeys({
  children,
  handleDownKey,
  handleEscKey,
  handleSubmitKey,
  handleUpKey,
}: Props) {
  const hotkeys = React.useMemo(
    () => [
      {
        combo: "up",
        global: true,
        label: "Move up the list",
        onKeyDown: handleUpKey,
        allowInInput: true,
        group: "Branches",
      },
      {
        combo: "down",
        global: true,
        label: "Move down the list",
        onKeyDown: handleDownKey,
        allowInInput: true,
        group: "Branches",
      },
      {
        combo: "return",
        global: true,
        label: "Submit",
        onKeyDown: handleSubmitKey,
        allowInInput: true,
        group: "Branches",
      },
      {
        combo: "esc",
        global: true,
        label: "ESC",
        onKeyDown: handleEscKey,
        allowInInput: true,
        group: "Branches",
      },
    ],
    [handleUpKey, handleDownKey, handleSubmitKey, handleEscKey],
  );

  useHotkeys(hotkeys);

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        minHeight: 0,
        overflow: "auto",
      }}
    >
      {children}
    </div>
  );
}

export default BranchListHotKeys;
