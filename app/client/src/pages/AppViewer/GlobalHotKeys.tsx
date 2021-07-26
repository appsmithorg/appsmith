import React from "react";
import { connect } from "react-redux";
import { Hotkey, Hotkeys } from "@blueprintjs/core";
import { HotkeysTarget } from "@blueprintjs/core/lib/esnext/components/hotkeys/hotkeysTarget.js";
import { setCommentMode as setCommentModeAction } from "actions/commentActions";

import { setCommentModeInUrl } from "pages/Editor/ToggleModeButton";

type Props = {
  resetCommentMode: () => void;
  children: React.ReactNode;
};

@HotkeysTarget
class GlobalHotKeys extends React.Component<Props> {
  public renderHotkeys() {
    return (
      <Hotkeys>
        <Hotkey
          combo="esc"
          global
          group="Canvas"
          label="Reset"
          onKeyDown={(e: any) => {
            this.props.resetCommentMode();
            e.preventDefault();
          }}
        />
        <Hotkey
          combo="v"
          global
          label="View Mode"
          onKeyDown={this.props.resetCommentMode}
        />
        <Hotkey
          combo="c"
          global
          label="Comment Mode"
          onKeyDown={() => setCommentModeInUrl(true)}
        />
      </Hotkeys>
    );
  }

  render() {
    return <div>{this.props.children}</div>;
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    resetCommentMode: () => dispatch(setCommentModeAction(false)),
  };
};

export default connect(null, mapDispatchToProps)(GlobalHotKeys);
