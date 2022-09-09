import React from "react";
import { Hotkey, Hotkeys } from "@blueprintjs/core";
import { HotkeysTarget } from "@blueprintjs/core/lib/esnext/components/hotkeys/hotkeysTarget.js";
import { JS_OBJECT_HOTKEYS_CLASSNAME } from "./constants";

type Props = {
  runActiveJSFunction: (e: KeyboardEvent) => void;
  children: React.ReactNode;
};

@HotkeysTarget
class JSObjectHotKeys extends React.Component<Props> {
  public renderHotkeys() {
    return (
      <Hotkeys>
        <Hotkey
          allowInInput
          combo="mod + enter"
          global
          label="Run Js Function"
          onKeyDown={this.props.runActiveJSFunction}
        />
      </Hotkeys>
    );
  }

  render() {
    /* 
    Blueprint's v3 decorated component must return a single DOM element in its render() method, not a custom React component. 
    This constraint allows HotkeysTarget to inject event handlers without creating an extra wrapper element.
    */
    return (
      <div className={JS_OBJECT_HOTKEYS_CLASSNAME}>{this.props.children}</div>
    );
  }
}

export default JSObjectHotKeys;
