import React, { Component } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { AppState } from "reducers";
import {
  getIsPropertyPaneVisible,
  getWidgetPropsForPropertyPane,
} from "selectors/propertyPaneSelectors";
import { PanelStack, IPanel } from "@blueprintjs/core";

import Popper from "pages/Editor/Popper";
import { generateClassName } from "utils/generators";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { scrollbarDark } from "constants/DefaultTheme";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyPaneTitle from "pages/Editor/PropertyPaneTitle";
import AnalyticsUtil from "utils/AnalyticsUtil";
import * as log from "loglevel";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import PropertyControlsGenerator from "./Generator";

const PropertyPaneWrapper = styled(PaneWrapper)`
  width: 100%;
  max-height: ${props => props.theme.propertyPane.height}px;
  width: ${props => props.theme.propertyPane.width}px;
  margin: ${props => props.theme.spaces[2]}px;
  box-shadow: 0px 0px 10px ${props => props.theme.colors.paneCard};
  border: ${props => props.theme.spaces[5]}px solid
    ${props => props.theme.colors.paneBG};
  border-right: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 ${props => props.theme.spaces[5]}px 0 0;
  text-transform: none;
  ${scrollbarDark};
`;

import PropertiesEditor from "pages/Editor/PropertyPane/PropertiesEditor";

const StyledPanelStack = styled(PanelStack)`
  height: ${props => props.theme.propertyPane.height}px;
  width: ${props => props.theme.propertyPane.width}px;
  margin: ${props => props.theme.spaces[2]}px;
  &&& .bp3-panel-stack-view {
    margin: 0;
    border: none;
    background: transparent;
  }
  &&& .bp3-panel-stack-header {
    display: none;
  }
`;

interface PropertyPaneState {
  currentPanelStack: IPanel[];
}

class PropertyPane extends Component<PropertyPaneProps, PropertyPaneState> {
  constructor(props: PropertyPaneProps) {
    super(props);
    const initialPanel: IPanel = {
      props: {},
      component: PropertiesEditor,
      title: "",
    };
    this.state = {
      currentPanelStack: [initialPanel],
    };
  }
  render() {
    if (this.props.isVisible) {
      log.debug("Property pane rendered");
      const content = this.renderPropertyPane();
      const el = document.getElementsByClassName(
        generateClassName(this.props.widgetProperties?.widgetId),
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

  addToPanelStack = (newPanel: IPanel) => {
    this.setState(state => ({
      currentPanelStack: [newPanel, ...state.currentPanelStack],
    }));
  };

  removeFromPanelStack = () => {
    this.setState(state => ({
      currentPanelStack: state.currentPanelStack.slice(1),
    }));
  };

  renderPropertyPane() {
    const { widgetProperties } = this.props;
    if (!widgetProperties) return <PropertyPaneWrapper />;
    return (
      <PropertyPaneWrapper
        onClick={(e: any) => {
          e.stopPropagation();
        }}
      >
        <PropertyPaneTitle
          key={widgetProperties.widgetId}
          title={widgetProperties.widgetName}
          widgetId={widgetProperties.widgetId}
          widgetType={widgetProperties?.type}
          onClose={this.props.hidePropertyPane}
        />
        <PropertyControlsGenerator {...widgetProperties} />
      </PropertyPaneWrapper>
    );
  }

  componentDidMount() {
    PerformanceTracker.stopTracking(
      PerformanceTransactionName.OPEN_PROPERTY_PANE,
    );
  }

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
  };
};

const mapDispatchToProps = (dispatch: any): PropertyPaneFunctions => {
  return {
    hidePropertyPane: () =>
      dispatch({
        type: ReduxActionTypes.HIDE_PROPERTY_PANE,
      }),
  };
};

export interface PropertyPaneProps extends PropertyPaneFunctions {
  widgetProperties?: WidgetProps;
  isVisible: boolean;
}

export interface PropertyPaneFunctions {
  hidePropertyPane: () => void;
}

export default connect(mapStateToProps, mapDispatchToProps)(PropertyPane);
