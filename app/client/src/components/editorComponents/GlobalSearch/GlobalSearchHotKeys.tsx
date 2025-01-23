import React, { useMemo } from "react";
import { useHotkeys } from "@blueprintjs/core";
import type { SearchItem, SelectEvent } from "./utils";

interface Props {
  modalOpen: boolean;
  toggleShow: () => void;
  handleUpKey: () => void;
  handleDownKey: () => void;
  handleItemLinkClick: (
    event: SelectEvent,
    item?: SearchItem,
    source?: string,
  ) => void;
  children: React.ReactNode;
}

function GlobalSearchHotKeys(props: Props) {
  const hotkeys = useMemo(
    () => [
      {
        combo: "up",
        onKeyDown: props.handleUpKey,
        global: false,
        allowInInput: true,
        group: "Omnibar",
        label: "Move up the list",
        disabled: !props.modalOpen,
      },
      {
        combo: "down",
        onKeyDown: props.handleDownKey,
        global: false,
        allowInInput: true,
        group: "Omnibar",
        label: "Move down the list",
        disabled: !props.modalOpen,
      },
      {
        combo: "return",
        onKeyDown: (event: KeyboardEvent) => {
          const activeElement = document.activeElement as HTMLElement;
          activeElement?.blur(); // scroll into view doesn't work with the search input focused
          props.handleItemLinkClick(event, null, "ENTER_KEY");
        },
        global: false,
        allowInInput: true,
        group: "Omnibar",
        label: "Navigate",
        disabled: !props.modalOpen,
      },
    ],
    [
      props.modalOpen,
      props.handleUpKey,
      props.handleDownKey,
      props.handleItemLinkClick,
    ],
  );

  const { handleKeyDown, handleKeyUp } = useHotkeys(hotkeys);

  return (
    <div onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
      {props.children}
    </div>
  );
}

export default GlobalSearchHotKeys;
