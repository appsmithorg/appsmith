import { connect, useSelector } from "react-redux";
import React, { Component } from "react";
import styled from "styled-components";
import { AppState } from "reducers";
import { PanelStack, IPanel, Classes, IPanelProps } from "@blueprintjs/core";

import * as log from "loglevel";
import {
  getIsPropertyPaneVisible,
  getPropertyPaneEnhancements,
  getWidgetPropsForPropertyPane,
} from "selectors/propertyPaneSelectors";
import Popper from "pages/Editor/Popper";
import { WidgetProps } from "widgets/BaseWidget";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { generateClassName } from "utils/generators";
import { scrollbarDark } from "constants/DefaultTheme";
import { hidePropertyPane } from "actions/propertyPaneActions";
import PaneWrapper from "components/editorComponents/PaneWrapper";
import PropertyPaneView, { UpdatePropertyPayload } from "./PropertyPaneView";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";

/** Styled Components */
const PropertyPaneWrapper = styled(PaneWrapper)`
  width: 100%;
  max-height: ${(props) => props.theme.propertyPane.height}px;
  width: ${(props) => props.theme.propertyPane.width}px;
  margin: ${(props) => props.theme.spaces[2]}px;
  box-shadow: 0px 0px 10px ${(props) => props.theme.colors.paneCard};
  border: ${(props) => props.theme.spaces[5]}px solid
    ${(props) => props.theme.colors.paneBG};
  border-right: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 ${(props) => props.theme.spaces[5]}px 0 0;
  text-transform: none;
  ${scrollbarDark};
`;

const StyledPanelStack = styled(PanelStack)`
  height: auto;
  width: 100%;
  margin: 0;
  &&& .bp3-panel-stack-view {
    margin: 0;
    border: none;
    background: transparent;
  }
  overflow: visible;
  position: static;
  &&& .${Classes.PANEL_STACK_VIEW} {
    position: static;
    overflow: hidden;
  }
`;

/** Interfaces */
export interface PropertyPaneProps extends PropertyPaneFunctions {
  widgetProperties?: WidgetProps;
  isVisible: boolean;
  propertyPaneEnhancements?: PropertyPaneEnhancements;
}

export interface PropertyPaneFunctions {
  hidePropertyPane: () => void;
}

interface PropertyPaneState {
  currentPanelStack: IPanel[];
}

export interface PropertyPaneEnhancements {
  additionalAutocomplete?: Record<
    string,
    (props: any) => Record<string, unknown>
  >;
  beforeChildPropertyUpdate?: (
    widgetName: string,
    parentWidgetId: string,
    parentWidgetName: string,
    path: string,
    value: any,
  ) => UpdatePropertyPayload[];
}

class PropertyPane extends Component<PropertyPaneProps, PropertyPaneState> {
  private panelWrapperRef = React.createRef<HTMLDivElement>();
  render() {
    const { isVisible, widgetProperties } = this.props;

    // only render properyPane if a widget is focussed which sets the isVisible to true
    if (isVisible) {
      log.debug("Property pane rendered");
      const content = this.renderPropertyPane();
      // Find the widget element in the DOM
      const el = document.getElementsByClassName(
        generateClassName(widgetProperties?.widgetId),
      )[0];

      return (
        <Popper
          isOpen={true}
          targetNode={el}
          zIndex={3}
          placement="right-start"
        >
          {content}
        </Popper>
      );
    } else {
      return null;
    }
  }

  /**
   * returns the content that goes in the popper. This is the main function that is responsible for
   * generating property pane
   */
  renderPropertyPane() {
    const {
      widgetProperties,
      hidePropertyPane,
      propertyPaneEnhancements,
    } = this.props;

    // if there are no widgetProperties, just render a blank property pane wrapper
    if (!widgetProperties) return <PropertyPaneWrapper />;

    return (
      <PropertyPaneWrapper
        ref={this.panelWrapperRef}
        onClick={(e: any) => {
          e.stopPropagation();
        }}
      >
        <StyledPanelStack
          onOpen={() => {
            const parent = this.panelWrapperRef.current;
            parent?.scrollTo(0, 0);
          }}
          initialPanel={{
            component: PropertyPaneView,
            props: {
              hidePropertyPane: hidePropertyPane,
              enhancements: propertyPaneEnhancements,
            },
          }}
          showPanelHeader={false}
        />
      </PropertyPaneWrapper>
    );
  }

  componentDidMount() {
    PerformanceTracker.stopTracking(
      PerformanceTransactionName.OPEN_PROPERTY_PANE,
    );
  }

  /**
   * here we are mainly doing some analytics based on the open/close state of propertypane
   *
   * @param prevProps
   */
  componentDidUpdate(prevProps: PropertyPaneProps) {
    if (
      this.props.widgetProperties?.widgetId !==
        prevProps.widgetProperties?.widgetId &&
      this.props.widgetProperties?.widgetId !== undefined
    ) {
      PerformanceTracker.stopTracking(
        PerformanceTransactionName.OPEN_PROPERTY_PANE,
      );
      if (prevProps.widgetProperties?.widgetId && prevProps.widgetProperties) {
        AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE", {
          widgetType: prevProps.widgetProperties.type,
          widgetId: prevProps.widgetProperties.widgetId,
        });
      }
      if (this.props.widgetProperties) {
        AnalyticsUtil.logEvent("PROPERTY_PANE_OPEN", {
          widgetType: this.props.widgetProperties.type,
          widgetId: this.props.widgetProperties.widgetId,
        });
      }
    }

    if (
      this.props.widgetProperties?.widgetId ===
        prevProps.widgetProperties?.widgetId &&
      this.props.isVisible &&
      !prevProps.isVisible &&
      this.props.widgetProperties !== undefined
    ) {
      AnalyticsUtil.logEvent("PROPERTY_PANE_OPEN", {
        widgetType: this.props.widgetProperties.type,
        widgetId: this.props.widgetProperties.widgetId,
      });
    }

    return true;
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    widgetProperties: getWidgetPropsForPropertyPane(state),
    isVisible: getIsPropertyPaneVisible(state),
    propertyPaneEnhancements: getPropertyPaneEnhancements(state),
  };
};

export default connect(mapStateToProps, { hidePropertyPane })(PropertyPane);
