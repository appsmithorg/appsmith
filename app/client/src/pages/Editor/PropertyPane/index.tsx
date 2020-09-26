import React, { Component } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { AppState } from "reducers";
import _ from "lodash";
import { PropertySection } from "reducers/entityReducers/propertyPaneConfigReducer";
import {
  updateWidgetPropertyRequest,
  setWidgetDynamicProperty,
} from "actions/controlActions";
import {
  getCurrentWidgetId,
  getPropertyConfig,
  getIsPropertyPaneVisible,
  getWidgetPropsForPropertyPane,
} from "selectors/propertyPaneSelectors";

import Popper from "pages/Editor/Popper";
import { ControlProps } from "components/propertyControls/BaseControl";
import { generateClassName } from "utils/generators";
import { RenderModes } from "constants/WidgetConstants";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { scrollbarDark } from "constants/DefaultTheme";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyPaneTitle from "pages/Editor/PropertyPaneTitle";
import PropertyControl from "pages/Editor/PropertyPane/PropertyControl";
import AnalyticsUtil from "utils/AnalyticsUtil";
import * as log from "loglevel";
import PaneWrapper from "pages/common/PaneWrapper";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";

const PropertySectionLabel = styled.div`
  color: ${props => props.theme.colors.paneSectionLabel};
  padding: ${props => props.theme.spaces[2]}px 0;
  font-size: ${props => props.theme.fontSizes[3]}px;
  display: flex;
  font-weight: bold;
  justify-content: flex-start;
  align-items: center;
`;

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

class PropertyPane extends Component<
  PropertyPaneProps & PropertyPaneFunctions
> {
  constructor(props: PropertyPaneProps & PropertyPaneFunctions) {
    super(props);
    this.onPropertyChange = this.onPropertyChange.bind(this);
  }

  render() {
    if (this.props.isVisible) {
      log.debug("Property pane rendered");
      const content = this.renderPropertyPane(this.props.propertySections);
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
          {content}
        </Popper>
      );
    } else {
      return null;
    }
  }

  renderPropertyPane(propertySections?: PropertySection[]) {
    const { widgetProperties } = this.props;
    if (!widgetProperties) return <PropertyPaneWrapper />;
    return (
      <PropertyPaneWrapper
        onClick={(e: any) => {
          e.stopPropagation();
        }}
      >
        <PropertyPaneTitle
          key={this.props.widgetId}
          title={widgetProperties.widgetName}
          widgetId={this.props.widgetId}
          widgetType={this.props.widgetProperties?.type}
          onClose={this.props.hidePropertyPane}
        />

        {!_.isNil(propertySections)
          ? _.map(propertySections, (propertySection: PropertySection) => {
              return this.renderPropertySection(
                propertySection,
                this.props.widgetId + propertySection.id,
              );
            })
          : undefined}
      </PropertyPaneWrapper>
    );
  }

  renderPropertySection(propertySection: PropertySection, key: string) {
    const { widgetProperties } = this.props;
    return (
      <div key={key}>
        {!_.isNil(propertySection) ? (
          <PropertySectionLabel>
            {propertySection.sectionName}
          </PropertySectionLabel>
        ) : (
          undefined
        )}
        <div>
          {_.map(
            propertySection.children,
            (propertyControlOrSection: ControlProps | PropertySection) => {
              if ("children" in propertyControlOrSection) {
                return this.renderPropertySection(
                  propertyControlOrSection,
                  propertyControlOrSection.id,
                );
              } else if (widgetProperties) {
                try {
                  return (
                    <PropertyControl
                      key={propertyControlOrSection.id}
                      propertyConfig={propertyControlOrSection}
                      widgetProperties={widgetProperties}
                      onPropertyChange={this.onPropertyChange}
                      toggleDynamicProperty={this.toggleDynamicProperty}
                    />
                  );
                } catch (e) {
                  console.log(e);
                }
              }
            },
          )}
        </div>
      </div>
    );
  }

  toggleDynamicProperty = (propertyName: string, isDynamic: boolean) => {
    const { widgetId } = this.props;
    this.props.setWidgetDynamicProperty(
      widgetId as string,
      propertyName,
      !isDynamic,
    );
    if (this.props.widgetProperties) {
      AnalyticsUtil.logEvent("WIDGET_TOGGLE_JS_PROP", {
        widgetType: this.props.widgetProperties.type,
        widgetName: this.props.widgetProperties.widgetName,
        propertyName: propertyName,
        propertyState: !isDynamic ? "JS" : "NORMAL",
      });
    }
  };

  componentDidMount() {
    PerformanceTracker.stopTracking(
      PerformanceTransactionName.OPEN_PROPERTY_PANE,
    );
  }

  componentDidUpdate(prevProps: PropertyPaneProps & PropertyPaneFunctions) {
    if (
      this.props.widgetId !== prevProps.widgetId &&
      this.props.widgetId !== undefined
    ) {
      PerformanceTracker.stopTracking(
        PerformanceTransactionName.OPEN_PROPERTY_PANE,
      );
      if (prevProps.widgetId && prevProps.widgetProperties) {
        AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE", {
          widgetType: prevProps.widgetProperties.type,
          widgetId: prevProps.widgetId,
        });
      }
      if (this.props.widgetProperties) {
        AnalyticsUtil.logEvent("PROPERTY_PANE_OPEN", {
          widgetType: this.props.widgetProperties.type,
          widgetId: this.props.widgetId,
        });
      }
    }

    if (
      this.props.widgetId === prevProps.widgetId &&
      this.props.isVisible &&
      !prevProps.isVisible &&
      this.props.widgetProperties !== undefined
    ) {
      AnalyticsUtil.logEvent("PROPERTY_PANE_OPEN", {
        widgetType: this.props.widgetProperties.type,
        widgetId: this.props.widgetId,
      });
    }

    return true;
  }

  onPropertyChange(propertyName: string, propertyValue: any) {
    this.props.updateWidgetProperty(
      this.props.widgetId,
      propertyName,
      propertyValue,
    );
    if (this.props.widgetProperties) {
      AnalyticsUtil.logEvent("WIDGET_PROPERTY_UPDATE", {
        widgetType: this.props.widgetProperties.type,
        widgetName: this.props.widgetProperties.widgetName,
        propertyName: propertyName,
        updatedValue: propertyValue,
      });
    }
  }
}

const mapStateToProps = (state: AppState): PropertyPaneProps => {
  const props = {
    propertySections: getPropertyConfig(state),
    widgetId: getCurrentWidgetId(state),
    widgetProperties: getWidgetPropsForPropertyPane(state),
    isVisible: getIsPropertyPaneVisible(state),
  };
  return props;
};

const mapDispatchToProps = (dispatch: any): PropertyPaneFunctions => {
  return {
    updateWidgetProperty: (
      widgetId: string,
      propertyName: string,
      propertyValue: any,
    ) =>
      dispatch(
        updateWidgetPropertyRequest(
          widgetId,
          propertyName,
          propertyValue,
          RenderModes.CANVAS,
        ),
      ),
    hidePropertyPane: () =>
      dispatch({
        type: ReduxActionTypes.HIDE_PROPERTY_PANE,
      }),
    setWidgetDynamicProperty: (
      widgetId: string,
      propertyName: string,
      isDynamic: boolean,
    ) => dispatch(setWidgetDynamicProperty(widgetId, propertyName, isDynamic)),
  };
};

export interface PropertyPaneProps {
  propertySections?: PropertySection[];
  widgetId?: string;
  widgetProperties?: WidgetProps;
  isVisible: boolean;
}

export interface PropertyPaneFunctions {
  setWidgetDynamicProperty: (
    widgetId: string,
    propertyName: string,
    isDynamic: boolean,
  ) => void;
  updateWidgetProperty: Function;
  hidePropertyPane: () => void;
}

export default connect(mapStateToProps, mapDispatchToProps)(PropertyPane);
