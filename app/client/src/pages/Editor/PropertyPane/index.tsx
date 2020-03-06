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
import { Divider } from "@blueprintjs/core";

import Popper from "pages/Editor/Popper";
import { ControlProps } from "components/propertyControls/BaseControl";
import {
  RenderModes,
  WIDGET_CLASSNAME_PREFIX,
} from "constants/WidgetConstants";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { CloseButton } from "components/designSystems/blueprint/CloseButton";
import { theme } from "constants/DefaultTheme";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyPaneTitle from "pages/Editor/PropertyPaneTitle";
import PropertyControl from "pages/Editor/PropertyPane/PropertyControl";
import AnalyticsUtil from "utils/AnalyticsUtil";

const PropertySectionLabel = styled.div`
  text-transform: uppercase;
  color: ${props => props.theme.colors.paneSectionLabel};
  padding: ${props => props.theme.spaces[5]}px 0;
  font-size: ${props => props.theme.fontSizes[2]}px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const PropertyPaneWrapper = styled.div`
  position: relative;
  width: 100%;
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
      const content = this.renderPropertyPane(this.props.propertySections);
      const el = document.getElementsByClassName(
        WIDGET_CLASSNAME_PREFIX + this.props.widgetId,
      )[0];
      return (
        <Popper isOpen={true} targetNode={el}>
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
      <PropertyPaneWrapper>
        <PropertyPaneTitle
          key={this.props.widgetId}
          title={widgetProperties.widgetName}
          widgetId={this.props.widgetId}
        />

        <CloseButton
          onClick={(e: any) => {
            this.props.hidePropertyPane();
            e.preventDefault();
            e.stopPropagation();
          }}
          size={theme.spaces[5]}
          color={theme.colors.paneSectionLabel}
        />
        <Divider />
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
        <div
          style={
            propertySection.orientation === "HORIZONTAL"
              ? { flexDirection: "row" }
              : { flexDirection: "column" }
          }
        >
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
  return {
    propertySections: getPropertyConfig(state),
    widgetId: getCurrentWidgetId(state),
    widgetProperties: getWidgetPropsForPropertyPane(state),
    isVisible: getIsPropertyPaneVisible(state),
  };
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
  widgetProperties?: WidgetProps; //TODO(abhinav): Secure type definition
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
