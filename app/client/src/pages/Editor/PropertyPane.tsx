import React, { Component } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { AppState } from "reducers";
import PropertyControlFactory from "utils/PropertyControlFactory";
import _ from "lodash";
import { PropertySection } from "reducers/entityReducers/propertyPaneConfigReducer";
import { updateWidgetProperty } from "actions/controlActions";
import {
  getCurrentWidgetId,
  getPropertyConfig,
  getIsPropertyPaneVisible,
  getWidgetPropsWithValidations,
} from "selectors/propertyPaneSelectors";
import { Divider } from "@blueprintjs/core";

import Popper from "./Popper";
import { ControlProps } from "components/propertyControls/BaseControl";
import {
  RenderModes,
  WIDGET_CLASSNAME_PREFIX,
} from "constants/WidgetConstants";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { CloseButton } from "components/designSystems/blueprint/CloseButton";
import { theme } from "constants/DefaultTheme";
import { WidgetProps } from "widgets/BaseWidget";

const PropertySectionLabel = styled.div`
  text-transform: uppercase;
  color: ${props => props.theme.colors.paneSectionLabel};
  padding: ${props => props.theme.spaces[5]}px 0;
  font-size: ${props => props.theme.fontSizes[2]}px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const PropertyPaneTitle = styled.div`
  text-transform: capitalize;
  color: ${props => props.theme.colors.textOnDarkBG};
  font-size: ${props => props.theme.fontSizes[3]}px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: ${props => props.theme.spaces[1]}px 0;
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
        <PropertyPaneTitle>{widgetProperties.widgetName}</PropertyPaneTitle>
        <CloseButton
          onClick={this.props.hidePropertyPane}
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
              } else {
                try {
                  const { propertyName } = propertyControlOrSection;
                  const config = { ...propertyControlOrSection };
                  if (widgetProperties) {
                    config.propertyValue = widgetProperties[propertyName];
                    config.isValid = widgetProperties.invalidProps
                      ? !(propertyName in widgetProperties.invalidProps)
                      : true;
                    config.validationMessage = widgetProperties.validationMessages
                      ? propertyName in widgetProperties.validationMessages
                        ? widgetProperties.validationMessages[propertyName]
                        : ""
                      : "";
                  }
                  return PropertyControlFactory.createControl(config, {
                    onPropertyChange: this.onPropertyChange,
                  });
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

  onPropertyChange(propertyName: string, propertyValue: any) {
    this.props.updateWidgetProperty(
      this.props.widgetId,
      propertyName,
      propertyValue,
    );
  }
}

const mapStateToProps = (state: AppState): PropertyPaneProps => {
  return {
    propertySections: getPropertyConfig(state),
    widgetId: getCurrentWidgetId(state),
    widgetProperties: getWidgetPropsWithValidations(state),
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
        updateWidgetProperty(
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
  };
};

export interface PropertyPaneProps {
  propertySections?: PropertySection[];
  widgetId?: string;
  widgetProperties?: WidgetProps; //TODO(abhinav): Secure type definition
  isVisible: boolean;
}

export interface PropertyPaneFunctions {
  updateWidgetProperty: Function;
  hidePropertyPane: () => void;
}

export default connect(mapStateToProps, mapDispatchToProps)(PropertyPane);
