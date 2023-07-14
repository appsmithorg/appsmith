import React from "react";
import classNames from "classnames";
import { Button } from "design-system";
import { displayHotkey } from "./utils";
import type { KeyboardEvent } from "./HotkeysDialog";
import { useClickOutside } from "@mantine/hooks";

type HotkeyButtonProps = {
  hotkey: {
    label: string;
    hotkey: string;
    action: (e: KeyboardEvent) => void;
    id: string;
  };
  editing: any;
  setEditing: (editing: any) => void;
};

export function HotkeyButton(props: HotkeyButtonProps) {
  const { editing, hotkey, setEditing } = props;
  const ref = useClickOutside(() => setEditing(false));

  const renderCombo = () => {
    if (editing.id == hotkey.id) {
      return "Press any key";
    }

    return displayHotkey(hotkey.hotkey);
  };

  return (
    <span ref={ref}>
      <Button
        className={classNames({
          "ring-2 ring-blue-500": editing.id === hotkey.id,
        })}
        kind="secondary"
        onClick={() =>
          setEditing({
            ...hotkey,
          })
        }
      >
        {renderCombo()}
      </Button>
    </span>
  );
}
