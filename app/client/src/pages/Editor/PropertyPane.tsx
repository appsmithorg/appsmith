import React, { Component } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { AppState } from "../../reducers";
import PropertyControlFactory from "../../utils/PropertyControlFactory";
import _ from "lodash";
import { ControlProps } from "../../propertyControls/BaseControl";
import { PropertySection } from "../../reducers/entityReducers/propertyPaneConfigReducer";
import { updateWidgetProperty } from "../../actions/controlActions";
import {
  getCurrentWidgetId,
  getCurrentReferenceNode,
  getPropertyConfig,
  getIsPropertyPaneVisible,
  getCurrentWidgetProperties,
} from "../../selectors/propertyPaneSelectors";

import Popper from "./Popper";

const PropertySectionLabel = styled.div`
  text-transform: uppercase;
  color: ${props => props.theme.colors.paneSectionLabel};
  padding: ${props => props.theme.spaces[5]}px 0;
  font-size: ${props => props.theme.fontSizes[2]}px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

class PropertyPane extends Component<
  PropertyPaneProps & PropertyPaneFunctions
> {
  constructor(props: PropertyPaneProps & PropertyPaneFunctions) {
    super(props);
    this.onPropertyChange = this.onPropertyChange.bind(this);
  }

  render() {
    if (this.props.isVisible && this.props.widgetId && this.props.targetNode) {
      const content = this.renderPropertyPane(this.props.propertySections);
      return (
        <Popper isOpen={true} targetRefNode={this.props.targetNode}>
          {content}
        </Popper>
      );
    } else {
      return null;
    }
  }

  renderPropertyPane(propertySections?: PropertySection[]) {
    return (
      <div>
        {!_.isNil(propertySections)
          ? _.map(propertySections, (propertySection: PropertySection) => {
              return this.renderPropertySection(
                propertySection,
                this.props.widgetId + propertySection.id,
              );
            })
          : undefined}
      </div>
    );
  }

  renderPropertySection(propertySection: PropertySection, key: string) {
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
                  propertyControlOrSection.propertyValue = this.props.widgetProperties[
                    propertyControlOrSection.propertyName
                  ];
                  return PropertyControlFactory.createControl(
                    propertyControlOrSection,
                    { onPropertyChange: this.onPropertyChange },
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
    widgetProperties: getCurrentWidgetProperties(state),
    isVisible: getIsPropertyPaneVisible(state),
    targetNode: getCurrentReferenceNode(state),
  };
};

const mapDispatchToProps = (dispatch: any): PropertyPaneFunctions => {
  return {
    updateWidgetProperty: (
      widgetId: string,
      propertyName: string,
      propertyValue: any,
    ) => dispatch(updateWidgetProperty(widgetId, propertyName, propertyValue)),
  };
};

export interface PropertyPaneProps {
  propertySections?: PropertySection[];
  widgetId?: string;
  widgetProperties?: any; //TODO(abhinav): Secure type definition
  isVisible: boolean;
  targetNode?: HTMLDivElement;
}

export interface PropertyPaneFunctions {
  updateWidgetProperty: Function;
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(PropertyPane);
