import React from "react";
import type { SetterConfig } from "entities/AppTheming";
import type { WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";

import * as config from "../config";
import { StatsComponent } from "../component";
import type { StatsWidgetProps } from "./types";
import type { AnvilConfig } from "WidgetProvider/constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { Elevations } from "widgets/anvil/constants";
import { ContainerComponent } from "widgets/anvil/Container";

class WDSStatsWidget extends BaseWidget<StatsWidgetProps, WidgetState> {
  constructor(props: StatsWidgetProps) {
    super(props);
  }

  static type = "WDS_STATS_WIDGET";

  static getConfig() {
    return config.metaConfig;
  }

  static getDefaults() {
    return config.defaultsConfig;
  }

  static getAutocompleteDefinitions() {
    return config.autocompleteConfig;
  }

  static getPropertyPaneContentConfig() {
    return config.propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return config.propertyPaneStyleConfig;
  }

  static getSetterConfig(): SetterConfig {
    return config.settersConfig;
  }

  static getAnvilConfig(): AnvilConfig | null {
    return config.anvilConfig;
  }

  static getMethods() {
    return config.methodsConfig;
  }

  getWidgetView() {
    const onClick = () => {
      if (this.props.onClick) {
        this.setState({ isLoading: true });

        super.executeAction({
          triggerPropertyName: "onClick",
          dynamicString: this.props.onClick,
          event: {
            type: EventType.ON_CLICK,
          },
        });

        return;
      }
    };

    return (
      <ContainerComponent
        elevatedBackground={this.props.elevatedBackground || false}
        elevation={Elevations.CARD_ELEVATION}
        widgetId={this.props.widgetId}
      >
        <StatsComponent
          {...this.props}
          onClick={this.props.onClick !== undefined ? onClick : undefined}
        />
      </ContainerComponent>
    );
  }
}

export { WDSStatsWidget };
