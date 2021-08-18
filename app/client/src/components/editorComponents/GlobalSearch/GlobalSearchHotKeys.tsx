import React from "react";
import { HotkeysTarget } from "@blueprintjs/core/lib/esnext/components/hotkeys/hotkeysTarget.js";
import { Hotkey, Hotkeys } from "@blueprintjs/core";
import { SearchItem, SelectEvent } from "./utils";

type Props = {
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
};
@HotkeysTarget
class GlobalSearchHotKeys extends React.Component<Props> {
  get hotKeysConfig() {
    return [
      {
        combo: "up",
        onKeyDown: this.props.handleUpKey,
        hideWhenModalClosed: true,
        allowInInput: true,
        group: "Omnibar",
        label: "Move up the list",
      },
      {
        combo: "down",
        onKeyDown: this.props.handleDownKey,
        hideWhenModalClosed: true,
        allowInInput: true,
        group: "Omnibar",
        label: "Move down the list",
      },
      {
        combo: "return",
        onKeyDown: (event: KeyboardEvent) => {
          const activeElement = document.activeElement as any;
          activeElement?.blur(); // scroll into view doesn't work with the search input focused
          this.props.handleItemLinkClick(event, null, "ENTER_KEY");
        },
        hideWhenModalClosed: true,
        allowInInput: true,
        group: "Omnibar",
        label: "Navigate",
      },
    ].filter(
      ({ hideWhenModalClosed }) =>
        !hideWhenModalClosed || (hideWhenModalClosed && this.props.modalOpen),
    );
  }

  renderHotkeys() {
    return (
      <Hotkeys>
        {this.hotKeysConfig.map(
          ({ allowInInput, combo, group, label, onKeyDown }, index) => (
            <Hotkey
              allowInInput={allowInInput}
              combo={combo}
              global={false}
              group={group}
              key={index}
              label={label}
              onKeyDown={onKeyDown}
            />
          ),
        )}
      </Hotkeys>
    );
  }

  render() {
    return <div>{this.props.children}</div>;
  }
}

export default GlobalSearchHotKeys;
