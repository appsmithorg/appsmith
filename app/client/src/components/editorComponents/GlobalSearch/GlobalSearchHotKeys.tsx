import React, { useMemo } from "react";
import { useHotkeys, type HotkeyConfig } from "@blueprintjs/core";
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

const GlobalSearchHotKeys: React.FC<Props> = ({
  children,
  handleDownKey,
  handleItemLinkClick,
  handleUpKey,
  modalOpen,
}) => {
  const hotkeys: HotkeyConfig[] = useMemo(
    () =>
      [
        {
          combo: "up",
          onKeyDown: handleUpKey,
          hideWhenModalClosed: true,
          allowInInput: true,
          group: "Omnibar",
          label: "Move up the list",
          global: false,
        },
        {
          combo: "down",
          onKeyDown: handleDownKey,
          hideWhenModalClosed: true,
          allowInInput: true,
          group: "Omnibar",
          label: "Move down the list",
          global: false,
        },
        {
          combo: "return",
          onKeyDown: (event: KeyboardEvent) => {
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const activeElement = document.activeElement as any;

            activeElement?.blur(); // scroll into view doesn't work with the search input focused
            handleItemLinkClick(event, null, "ENTER_KEY");
          },
          hideWhenModalClosed: true,
          allowInInput: true,
          group: "Omnibar",
          label: "Navigate",
          global: false,
        },
      ].filter(
        ({ hideWhenModalClosed }) =>
          !hideWhenModalClosed || (hideWhenModalClosed && modalOpen),
      ),
    [handleUpKey, handleDownKey, handleItemLinkClick, modalOpen],
  );

  const { handleKeyDown, handleKeyUp } = useHotkeys(hotkeys);

  return (
    <div onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
      {children}
    </div>
  );
};

export default GlobalSearchHotKeys;
