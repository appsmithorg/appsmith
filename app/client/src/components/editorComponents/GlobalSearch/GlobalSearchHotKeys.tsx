import React from "react";
import { HotkeysTarget } from "@blueprintjs/core/lib/esnext/components/hotkeys/hotkeysTarget.js";
import { Hotkey, Hotkeys } from "@blueprintjs/core";
import { SearchItem } from "./utils";

type Props = {
  modalOpen: boolean;
  toggleShow: () => void;
  handleUpKey: () => void;
  handleDownKey: () => void;
  handleItemLinkClick: (item?: SearchItem, source?: string) => void;
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
        onKeyDown: () => {
          const activeElement = document.activeElement as any;
          activeElement?.blur(); // scroll into view doesn't work with the search input focused
          this.props.handleItemLinkClick(null, "ENTER_KEY");
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
          ({ combo, onKeyDown, allowInInput, label, group }, index) => (
            <Hotkey
              key={index}
              global={false}
              combo={combo}
              onKeyDown={onKeyDown}
              label={label}
              allowInInput={allowInInput}
              group={group}
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
