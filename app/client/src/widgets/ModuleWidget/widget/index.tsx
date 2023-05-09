import React from "react";
import styled from "styled-components";

import BaseWidget from "widgets/BaseWidget";
import WidgetFactory from "utils/WidgetFactory";
import { Positioning } from "utils/autoLayout/constants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { AutocompletionDefinitions } from "widgets/constants";
import type { DerivedPropertiesMap } from "utils/WidgetFactory";
import type { WidgetType } from "constants/WidgetConstants";
import type { Stylesheet } from "entities/AppTheming";

const StyledWrapper = styled.div`
  & > .t--widget-containerwidget {
    top: -2px !important;
    left -2px !important;
    z-index: 0 !important;
  }
`;

export interface ModuleWidgetProps extends WidgetProps {
  name: string;
  data: Record<string, unknown>;
  hasChanges: boolean;
}

class ModuleWidget extends BaseWidget<any, any> {
  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {};
  }

  static getPropertyPaneContentConfig() {
    return [];
  }

  static getPropertyPaneStyleConfig() {
    return [];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }
  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }
  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  static getStylesheetConfig(): Stylesheet {
    return {};
  }

  renderChildWidget = (childWidgetData: WidgetProps): React.ReactNode => {
    const childWidget = { ...childWidgetData };

    const { componentHeight, componentWidth } = this.getComponentDimensions();
    childWidget.overrideProps = {
      leftColumn: 0,
      topColumn: 0,
      noContainerOffset: true,
    };
    childWidget.overrideProps.rightColumn = componentWidth;
    childWidget.overrideProps.bottomRow = this.props.shouldScrollContents
      ? childWidget.bottomRow
      : componentHeight;
    childWidget.overrideProps.minHeight = componentHeight;
    childWidget.overrideProps.shouldScrollContents = false;
    childWidget.overrideProps.canExtend = this.props.shouldScrollContents;

    childWidget.overrideProps.parentId = this.props.widgetId;
    // Pass layout controls to children
    childWidget.overrideProps.positioning =
      childWidget?.positioning || this.props.positioning;
    childWidget.overrideProps.useAutoLayout = this.props.positioning
      ? this.props.positioning === Positioning.Vertical
      : false;
    return WidgetFactory.createWidget(childWidget, this.props.renderMode);
  };

  getPageView() {
    return (
      <StyledWrapper>
        {(this.props.metaWidgetChildrenStructure || []).map(
          this.renderChildWidget,
        )}
      </StyledWrapper>
    );
  }

  static getWidgetType(): WidgetType {
    return "MODULE_WIDGET";
  }
}

export default ModuleWidget;
