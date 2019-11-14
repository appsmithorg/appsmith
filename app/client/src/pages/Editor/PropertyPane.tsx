import React, { Component } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { AppState, DataTree } from "../../reducers";
import PropertyControlFactory from "../../utils/PropertyControlFactory";
import _ from "lodash";
import { PropertySection } from "../../reducers/entityReducers/propertyPaneConfigReducer";
import {
  updateWidgetProperty,
  updateWidgetPropertyValidation,
} from "../../actions/controlActions";
import {
  getCurrentWidgetId,
  getCurrentReferenceNode,
  getPropertyConfig,
  getIsPropertyPaneVisible,
  getCurrentWidgetProperties,
  getPropertyErrors,
} from "../../selectors/propertyPaneSelectors";
import { Divider } from "@blueprintjs/core";

import Popper from "./Popper";
import { ControlProps } from "../../components/propertyControls/BaseControl";
import { RenderModes } from "../../constants/WidgetConstants";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getDataTree } from "../../selectors/entitiesSelector";
import { getDynamicValue as extractDynamicValue } from "../../utils/DynamicBindingUtils";
import {
  ErrorCode,
  ERROR_CODES_MESSAGES,
} from "../../constants/validationErrorCodes";
import { CloseButton } from "components/designSystems/blueprint/CloseButton";
import { theme } from "../../constants/DefaultTheme";

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
`;

class PropertyPane extends Component<
  PropertyPaneProps & PropertyPaneFunctions
> {
  constructor(props: PropertyPaneProps & PropertyPaneFunctions) {
    super(props);
    this.onPropertyChange = this.onPropertyChange.bind(this);
    this.getDynamicValue = this.getDynamicValue.bind(this);
    this.setPropertyValidation = this.setPropertyValidation.bind(this);
  }

  getPropertyValue = (propertyName: string) => {
    const { widgetProperties } = this.props;
    const { dynamicBindings } = widgetProperties;
    if (dynamicBindings && dynamicBindings[propertyName]) {
      return dynamicBindings[propertyName];
    }
    return widgetProperties[propertyName];
  };

  getPropertyValidation = (propertyName: string): string | undefined => {
    const { propertyErrors, widgetId } = this.props;
    if (!widgetId) return undefined;
    if (widgetId in propertyErrors) {
      const errorCode: ErrorCode = propertyErrors[widgetId][propertyName];
      return ERROR_CODES_MESSAGES[errorCode];
    } else {
      return undefined;
    }
  };

  render() {
    if (this.props.isVisible) {
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
      <PropertyPaneWrapper>
        <PropertyPaneTitle>
          {this.props.widgetProperties.widgetName}
        </PropertyPaneTitle>
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
                  propertyControlOrSection.propertyValue = this.getPropertyValue(
                    propertyControlOrSection.propertyName,
                  );
                  propertyControlOrSection.propertyError = this.getPropertyValidation(
                    propertyControlOrSection.propertyName,
                  );
                  return PropertyControlFactory.createControl(
                    propertyControlOrSection,
                    {
                      onPropertyChange: this.onPropertyChange,
                      getDynamicValue: this.getDynamicValue,
                      setPropertyValidation: this.setPropertyValidation,
                    },
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

  getDynamicValue(dynamicBinding: string) {
    const { dataTree } = this.props;
    return extractDynamicValue(dynamicBinding, dataTree);
  }

  setPropertyValidation(propertyName: string, errorCode: ErrorCode) {
    if (this.props.widgetId) {
      this.props.setPropertyValidation(
        this.props.widgetId,
        propertyName,
        errorCode,
      );
    }
  }
}

const mapStateToProps = (state: AppState): PropertyPaneProps => {
  return {
    propertySections: getPropertyConfig(state),
    dataTree: getDataTree(state),
    propertyErrors: getPropertyErrors(state),
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
    setPropertyValidation: (
      widgetId: string,
      propertyName: string,
      errorCode: ErrorCode,
    ) =>
      dispatch(
        updateWidgetPropertyValidation(widgetId, propertyName, errorCode),
      ),
  };
};

export interface PropertyPaneProps {
  propertySections?: PropertySection[];
  propertyErrors: Record<string, Record<string, ErrorCode>>;
  dataTree: DataTree;
  widgetId?: string;
  widgetProperties?: any; //TODO(abhinav): Secure type definition
  isVisible: boolean;
  targetNode?: HTMLDivElement;
}

export interface PropertyPaneFunctions {
  updateWidgetProperty: Function;
  hidePropertyPane: () => void;
  setPropertyValidation: (
    widgetId: string,
    propertyName: string,
    errorCode: ErrorCode,
  ) => void;
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(PropertyPane);
