import type { HotkeyItem } from "@mantine/hooks";
import { useHotkeys } from "@mantine/hooks";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Modal, ModalContent, Text, Input } from "design-system";

import { HotkeyButton } from "./HotkeyButton";
import { useHotKeysConfig } from "./shortcuts";
import { initHotkeys, toggleHotKeysDialog } from "actions/hotkeysActions";
import { getHotkeysDialogOpen } from "selectors/hotkeysSelectors";
import { getKeyComboString } from "@blueprintjs/core";

type Hotkey = {
  label: string;
  hotkey: string;
  action: (e: KeyboardEvent) => void;
  id: string;
};

export type KeyboardEvent = Parameters<HotkeyItem[1]>[0];

const getHotKeys = (hotkeys: Array<Hotkey>) => {
  const hotKeysFromLocalStorage = localStorage.getItem("hotkeys");
  const savedHotKeysMap = JSON.parse(hotKeysFromLocalStorage || "{}");

  return hotkeys.map((hotkey) => {
    return {
      ...hotkey,
      hotkey: savedHotKeysMap[hotkey.id] || hotkey.hotkey,
    };
  });
};

export function HotkeysDialog() {
  const dispatch = useDispatch();
  const [input, setInput] = useState("");
  const isDialogOpen = useSelector(getHotkeysDialogOpen);
  const hotkeysConfig = useHotKeysConfig();
  const [hotkeys, setHotkeys] = useState(getHotKeys(hotkeysConfig));
  const [editingHotKey, setEditingHotKey] = useState<any>(false);
  const [filteredHotKeys, setFilteredHotKeys] = useState(hotkeys);

  useEffect(() => {
    setHotkeys(getHotKeys(hotkeysConfig));
  }, [hotkeysConfig]);

  useEffect(() => {
    const hotkeysMap = {
      ...hotkeys.reduce((acc, hotkey) => {
        acc[hotkey.id] = hotkey.hotkey;
        return acc;
      }, {} as Record<string, string>),
    };

    dispatch(initHotkeys(hotkeysMap));
  }, [hotkeys]);

  /**
   * track hotkeys dialog open state
   *
   * @param open
   */
  const onOpenChange = (open: boolean) => {
    if (open === false) {
      dispatch(toggleHotKeysDialog(false));
    }
  };

  /**
   * filter hotkeys by label or hotkey
   * used to filter hotkeys in the dialog whenever user types in the search box
   *
   * @param e
   */
  const filterHotKeys = () => {
    const value = input.toLowerCase();

    const computedHotKeys = hotkeys.filter((hotkey) => {
      return (
        hotkey.label.toLowerCase().includes(value) ||
        hotkey.hotkey.toLowerCase().includes(value)
      );
    });

    return computedHotKeys;
  };

  /**
   * set input value in state on text change
   *
   * @param e
   */
  const onChangeInput = (value: string) => {
    setInput(value);
  };

  useEffect(() => {
    setFilteredHotKeys(filterHotKeys());
  }, [input]);

  // register hotkeys
  useHotkeys(
    hotkeys.map((hotkey) => {
      return [
        hotkey.hotkey,
        (e: KeyboardEvent) => {
          if (isDialogOpen) return;

          hotkey.action(e);
        },
      ];
    }),
  );

  /**
   * save hot keys in local storage
   *
   * for example:
   *
   * "hotkeys": "{
   *   "TOGGLE_OMNIBAR": "mod+K"
   * }
   * @param newHotKey
   * @param actionKey
   */
  const saveHotKeyInLocalStorage = (newHotkey: string, hotkeyId: string) => {
    if (newHotkey) {
      const hotKeysFromLocalStorage = localStorage.getItem("hotkeys");
      const hotKeys = JSON.parse(hotKeysFromLocalStorage || "{}");

      hotKeys[hotkeyId] = newHotkey;

      localStorage.setItem("hotkeys", JSON.stringify(hotKeys));
    }
  };

  useEffect(() => {
    const keydownListener = (e: KeyboardEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (e.key === "Meta") return;
      if (e.key === "Shift") return;
      if (e.key === "Control") return;

      if (e.key === "Escape") {
        setEditingHotKey(false);

        return;
      }

      if (e.key === "Enter") {
        setEditingHotKey(false);

        return;
      }

      const newHotkey = getKeyComboString(e);

      const computedHotKeys = hotkeys.map((hotkey) => {
        if (hotkey.hotkey !== newHotkey && editingHotKey.id === hotkey.id) {
          return {
            ...hotkey,
            hotkey: newHotkey,
          };
        }

        return hotkey;
      });

      setHotkeys(computedHotKeys);
      setFilteredHotKeys(computedHotKeys);
      saveHotKeyInLocalStorage(newHotkey, editingHotKey.id);

      setEditingHotKey(false);
    };

    if (editingHotKey) {
      document.documentElement.addEventListener("keydown", keydownListener);
    }

    if (!editingHotKey) {
      document.documentElement.removeEventListener("keydown", keydownListener);
    }

    return () =>
      document.documentElement.removeEventListener("keydown", keydownListener);
  }, [editingHotKey]);

  return (
    <Modal onOpenChange={onOpenChange} open={isDialogOpen}>
      <ModalContent>
        <div className="h-[60vh] overflow-auto pr-4 -mr-4">
          <div className="flex items-center">
            <div className="flex-grow">
              <Text kind="heading-m" renderAs="h1">
                Search hotkeys
              </Text>
              <Text renderAs="p">
                Showing {filteredHotKeys.length} hotkeys.
              </Text>
            </div>
            <div className="max-w-48">
              <Input
                onChange={onChangeInput}
                placeholder="Toggle Omnibar, Toggle Preview, ... etc"
                size="md"
                startIcon="search"
              />
            </div>
          </div>
          <ul className="flex flex-col mt-8">
            {filteredHotKeys.map((hotkey) => {
              return (
                <li
                  className="flex items-center justify-between py-4 border-b last:border-b-0"
                  key={hotkey.id}
                >
                  <div className="flex-grow">
                    <Text kind="action-l">{hotkey.label}</Text>
                  </div>
                  <div>
                    <HotkeyButton
                      editing={editingHotKey}
                      hotkey={hotkey}
                      setEditing={setEditingHotKey}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </ModalContent>
    </Modal>
  );
}
