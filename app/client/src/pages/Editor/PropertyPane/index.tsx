import React, { Component } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { AppState } from "reducers";
import {
  getCurrentWidgetId,
  getIsPropertyPaneVisible,
} from "selectors/propertyPaneSelectors";
import { PanelStack, IPanel } from "@blueprintjs/core";

import Popper from "pages/Editor/Popper";
import { generateClassName } from "utils/generators";
import * as log from "loglevel";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
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

  componentDidMount() {
    PerformanceTracker.stopTracking(
      PerformanceTransactionName.OPEN_PROPERTY_PANE,
    );
  }

  componentDidUpdate(prevProps: PropertyPaneProps) {
    if (
      this.props.widgetId !== prevProps.widgetId &&
      this.props.widgetId !== undefined
    ) {
      PerformanceTracker.stopTracking(
        PerformanceTransactionName.OPEN_PROPERTY_PANE,
      );
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

  render() {
    if (this.props.isVisible) {
      log.debug("Property pane rendered");
      const el = document.getElementsByClassName(
        generateClassName(this.props.widgetId),
      )[0];
      return (
        <Popper
          isOpen={true}
          targetNode={el}
          zIndex={3}
          placement="right-start"
        >
          <StyledPanelStack
            initialPanel={this.state.currentPanelStack[0]}
            onOpen={this.addToPanelStack}
            onClose={this.removeFromPanelStack}
          />
        </Popper>
      );
    } else {
      return null;
    }
  }
}

const mapStateToProps = (state: AppState): PropertyPaneProps => {
  const props = {
    widgetId: getCurrentWidgetId(state),
    isVisible: getIsPropertyPaneVisible(state),
  };
  return props;
};

export interface PropertyPaneProps {
  widgetId?: string;
  isVisible: boolean;
}

export default connect(mapStateToProps)(PropertyPane);
