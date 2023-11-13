import React from "react";

import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { Button } from "design-system";

interface ButtonControlState {
  isSourceEditorOpen: boolean;
  sourceEditor: Window | null;
}

class ButtonControl extends BaseControl<ControlProps, ButtonControlState> {
  state = {
    isSourceEditorOpen: false,
    sourceEditor: null,
  };

  onCTAClick = () => {
    if (
      this.state.isSourceEditorOpen &&
      !this.state.sourceEditor?.closed &&
      this.state.sourceEditor
    ) {
      this.state.sourceEditor.focus();
      this.state.sourceEditor.location.href =
        this.state.sourceEditor.location.origin + "/applications";
    } else {
      const editSourceWindow = window.open("/applications", "_blank");

      if (editSourceWindow) {
        this.setState({
          isSourceEditorOpen: true,
          sourceEditor: editSourceWindow,
        });
      }
    }
  };

  render() {
    return (
      <Button
        kind="secondary"
        onClick={this.onCTAClick}
        size="md"
        style={{
          width: "100%",
        }}
      >
        Edit Source
      </Button>
    );
  }

  static getControlType() {
    return "CUSTOM_WIDGET_BUTTON_CONTROL";
  }
}

export default ButtonControl;
