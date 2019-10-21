import React, { Component } from "react";
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
} from "../../selectors/propertyPaneSelectors";

import Popper from "./Popper";

class PropertyPane extends Component<
  PropertyPaneProps & PropertyPaneFunctions
> {
  constructor(props: PropertyPaneProps & PropertyPaneFunctions) {
    super(props);
    this.onPropertyChange = this.onPropertyChange.bind(this);
  }

  render() {
    if (
      this.props.isVisible &&
      this.props.widgetId &&
      this.props.targetNode &&
      this.props.propertySections
    ) {
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
                propertySection.id,
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
          <div>{propertySection.sectionName}</div>
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
    // this.props.updateWidgetProperty(
    //   this.props.widgetId,
    //   propertyName,
    //   propertyValue,
    // );
  }
}

const mapStateToProps = (state: AppState): PropertyPaneProps => {
  return {
    propertySections: getPropertyConfig(state),
    widgetId: getCurrentWidgetId(state),
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
