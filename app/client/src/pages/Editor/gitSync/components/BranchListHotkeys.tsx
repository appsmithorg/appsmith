import React from "react";
import { HotkeysTarget } from "@blueprintjs/core/lib/esnext/components/hotkeys/hotkeysTarget.js";
import { Hotkey, Hotkeys } from "@blueprintjs/core";

type Props = {
  handleUpKey: () => void;
  handleDownKey: () => void;
  handleSubmitKey: () => void;
  handleEscKey: () => void;
  children: React.ReactNode;
};
@HotkeysTarget
class GlobalSearchHotKeys extends React.Component<Props> {
  get hotKeysConfig() {
    return [
      {
        combo: "up",
        onKeyDown: () => {
          this.props.handleUpKey();
        },
        allowInInput: true,
        group: "Branches",
        label: "Move up the list",
      },
      {
        combo: "down",
        onKeyDown: this.props.handleDownKey,
        allowInInput: true,
        group: "Branches",
        label: "Move down the list",
      },
      {
        combo: "return",
        onKeyDown: this.props.handleSubmitKey,
        allowInInput: true,
        group: "Branches",
        label: "Submit",
      },
      {
        combo: "ESC",
        onKeyDown: this.props.handleEscKey,
        allowInInput: true,
        group: "Branches",
        label: "ESC",
      },
    ];
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
        {this.props.children}
      </div>
    );
  }
}

export default GlobalSearchHotKeys;
