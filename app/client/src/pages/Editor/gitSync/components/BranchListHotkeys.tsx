import React, { useMemo } from "react";
import { useHotkeys } from "@blueprintjs/core";

interface Props {
  handleUpKey: () => void;
  handleDownKey: () => void;
  handleSubmitKey: () => void;
  handleEscKey: () => void;
  children: React.ReactNode;
}

function BranchListHotkeys({
  children,
  handleDownKey,
  handleEscKey,
  handleSubmitKey,
  handleUpKey,
}: Props) {
  const hotkeys = useMemo(
    () => [
      {
        combo: "up",
        global: false,
        label: "Move up the list",
        onKeyDown: handleUpKey,
        allowInInput: true,
        group: "Branches",
      },
      {
        combo: "down",
        global: false,
        label: "Move down the list",
        onKeyDown: handleDownKey,
        allowInInput: true,
        group: "Branches",
      },
      {
        combo: "return",
        global: false,
        label: "Submit",
        onKeyDown: handleSubmitKey,
        allowInInput: true,
        group: "Branches",
      },
      {
        combo: "ESC",
        global: false,
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

export default BranchListHotkeys;
