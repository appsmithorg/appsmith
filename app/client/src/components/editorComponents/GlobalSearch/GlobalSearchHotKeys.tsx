import React from "react";
import { HotkeysTarget } from "@blueprintjs/core/lib/esnext/components/hotkeys/hotkeysTarget.js";
import { Hotkey, Hotkeys } from "@blueprintjs/core";
import AnalyticsUtil from "utils/AnalyticsUtil";
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
        combo: "mod + k",
        onKeyDown: (e: KeyboardEvent) => {
          e.preventDefault();
          this.props.toggleShow();
          AnalyticsUtil.logEvent("OPEN_OMNIBAR", { source: "HOTKEY_COMBO" });
        },
        hideWhenModalClosed: false,
        allowInInput: false,
        label: "Show omnibar",
        global: true,
      },
      {
        combo: "up",
        onKeyDown: this.props.handleUpKey,
        hideWhenModalClosed: true,
        allowInInput: true,
        group: "Omnibar",
      },
      {
        combo: "down",
        onKeyDown: this.props.handleDownKey,
        hideWhenModalClosed: true,
        allowInInput: true,
        group: "Omnibar",
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
          ({ combo, onKeyDown, allowInInput, label, global }, index) => (
            <Hotkey
              key={index}
              global={global}
              combo={combo}
              onKeyDown={onKeyDown}
              label={label}
              allowInInput={allowInInput}
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
