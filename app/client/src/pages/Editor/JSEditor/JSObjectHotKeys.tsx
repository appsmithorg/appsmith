import React, { useMemo } from "react";
import { useHotkeys } from "@blueprintjs/core";
import { JS_OBJECT_HOTKEYS_CLASSNAME } from "./constants";

interface Props {
  runActiveJSFunction: (e: KeyboardEvent) => void;
  children: React.ReactNode;
}

function JSObjectHotKeys({ children, runActiveJSFunction }: Props) {
  const hotkeys = useMemo(
    () => [
      {
        combo: "mod + enter",
        global: true,
        label: "Run Js Function",
        onKeyDown: runActiveJSFunction,
      },
    ],
    [runActiveJSFunction],
  );

  useHotkeys(hotkeys);

  return <div className={JS_OBJECT_HOTKEYS_CLASSNAME}>{children}</div>;
}

export default JSObjectHotKeys;
