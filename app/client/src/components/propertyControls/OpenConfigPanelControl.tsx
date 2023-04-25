import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { Button } from "design-system";

class OpenConfigPanelControl extends BaseControl<OpenConfigPanelControlProps> {
  constructor(props: OpenConfigPanelControlProps) {
    super(props);
  }

  openConfigPanel = () => {
    this.props.openNextPanel({
      index: 0,
      ...this.props.propertyValue,
      propPaneId: this.props.widgetProperties.widgetId,
    });
  };

  render() {
    const { buttonConfig, widgetProperties } = this.props;
    const { icon, label } = buttonConfig;
    const { widgetName } = widgetProperties;

    return (
      <div className="flex flex-col">
        <Button
          className={`t--${widgetName}-open-next-panel-button`}
          endIcon={icon}
          kind="secondary"
          onClick={this.openConfigPanel}
          size="md"
        >
          {label}
        </Button>
      </div>
    );
  }

  static getControlType() {
    return "OPEN_CONFIG_PANEL";
  }
}

export interface OpenConfigPanelControlProps extends ControlProps {
  buttonConfig: {
    icon: string;
    label: string;
  };
}

export default OpenConfigPanelControl;
