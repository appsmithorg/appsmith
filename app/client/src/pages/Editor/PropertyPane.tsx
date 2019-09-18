import React, { Component } from "react";
import { connect } from "react-redux";
import { AppState } from "../../reducers";
import PropertyControlFactory from "../../utils/PropertyControlFactory";
import _ from "lodash";
import { ControlProps } from "../propertyControls/BaseControl";
import { PropertySection } from "../../reducers/entityReducers/propertyPaneConfigReducer";
import { updateWidgetProperty } from "../../actions/controlActions";

class PropertyPane extends Component<
  PropertyPaneProps & PropertyPaneFunctions
> {
  constructor(props: PropertyPaneProps & PropertyPaneFunctions) {
    super(props);
    this.onPropertyChange = this.onPropertyChange.bind(this);
  }

  render() {
    if (this.props.isVisible) {
      return (
        <div>
          {!_.isNil(this.props.propertySections)
            ? _.map(
                this.props.propertySections,
                (propertySection: PropertySection) => {
                  return this.renderPropertySection(
                    propertySection,
                    propertySection.id,
                  );
                },
              )
            : undefined}
        </div>
      );
    } else {
      return null;
    }
  }

  renderPropertySection(
    propertySection: PropertySection,
    key: string,
    isHorizontal?: boolean,
  ) {
    return (
      <div key={key}>
        {!_.isNil(propertySection) ? (
          <div>{propertySection.sectionName}</div>
        ) : (
          undefined
        )}
        <div
          style={
            isHorizontal
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
                  true,
                );
              } else {
                return PropertyControlFactory.createControl(
                  propertyControlOrSection,
                  { onPropertyChange: this.onPropertyChange },
                );
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
  let propertyConfig = undefined;
  if (!_.isNil(state.ui.propertyPane.widgetId)) {
    const widget = state.entities.canvasWidgets[state.ui.propertyPane.widgetId];
    propertyConfig = state.entities.propertyConfig.config[widget.widgetType];
  }
  return {
    propertySections: propertyConfig,
    widgetId: state.ui.propertyPane.widgetId,
    isVisible: state.ui.propertyPane.isVisible,
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
}

export interface PropertyPaneFunctions {
  updateWidgetProperty: Function;
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(PropertyPane);
