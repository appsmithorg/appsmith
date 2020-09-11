import React from "react";
import styled, { AnyStyledComponent } from "styled-components";
import _ from "lodash";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { PropertySection } from "reducers/entityReducers/propertyPaneConfigReducer";
import {
  Divider,
  Icon,
  Tooltip,
  Position,
  IPanel,
  IPanelProps,
} from "@blueprintjs/core";
import {
  getCurrentWidgetId,
  getPropertyConfig,
  getIsPropertyPaneVisible,
  getWidgetPropsForPropertyPane,
} from "selectors/propertyPaneSelectors";
import {
  updateWidgetPropertyRequest,
  setWidgetDynamicProperty,
} from "actions/controlActions";
import { RenderModes } from "constants/WidgetConstants";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { ControlProps } from "components/propertyControls/BaseControl";
import { CloseButton } from "components/designSystems/blueprint/CloseButton";
import { getColorWithOpacity, theme } from "constants/DefaultTheme";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyPaneTitle from "pages/Editor/PropertyPaneTitle";
import PropertyTitleEditor from "pages/Editor/PropertyPane/PropertyTitleEditor";
import PropertyControl from "pages/Editor/PropertyPane/PropertyControl";
import AnalyticsUtil from "utils/AnalyticsUtil";
import PaneWrapper from "pages/common/PaneWrapper";
import { BindingText } from "pages/Editor/APIEditor/Form";
import { ControlIcons } from "icons/ControlIcons";

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
  position: relative;
  width: 100%;
  max-height: ${props => props.theme.propertyPane.height}px;
  width: ${props => props.theme.propertyPane.width}px;
  box-shadow: 0px 0px 10px ${props => props.theme.colors.paneCard};
  border: ${props => props.theme.spaces[5]}px solid
    ${props => props.theme.colors.paneBG};
  border-right: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 ${props => props.theme.spaces[5]}px 0 0;
  text-transform: none;

  scrollbar-color: ${props => props.theme.colors.paneCard}
    ${props => props.theme.colors.paneBG};
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px
      ${props => getColorWithOpacity(props.theme.colors.paneBG, 0.3)};
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.colors.paneCard};
    outline: 1px solid ${props => props.theme.paneText};
    border-radius: ${props => props.theme.radii[1]}px;
  }
`;

const StyledToolTip = styled(Tooltip)`
  position: absolute;
  top: 0;
  right: 35px;
`;

const PaneTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: ${props => props.theme.colors.paneBG};
  color: ${props => props.theme.colors.textOnDarkBG};
`;

const StyledBackIcon = styled(ControlIcons.BACK_CONTROL as AnyStyledComponent)`
  padding: 0;
  position: relative;
  cursor: pointer;
  top: 3px;
  margin-right: 8px;
  & svg {
    width: 16px;
    height: 16px;
    path {
      fill: ${props => props.theme.colors.paneText};
    }
  }
`;

const PropertySectionComponent = (props: PropertySectionComponentProps) => {
  const { propertySection, id, widgetProperties } = props;
  return (
    <div key={id}>
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
              return (
                <PropertySectionComponent
                  propertySection={propertyControlOrSection}
                  id={propertyControlOrSection.id}
                  widgetProperties={widgetProperties}
                  onPropertyChange={props.onPropertyChange}
                  toggleDynamicProperty={props.toggleDynamicProperty}
                  openNextPanel={props.openNextPanel}
                  childProperties={props.childProperties}
                />
              );
            } else if (widgetProperties) {
              try {
                return (
                  <PropertyControl
                    key={propertyControlOrSection.id}
                    propertyConfig={propertyControlOrSection}
                    widgetProperties={_.merge(
                      widgetProperties,
                      props.childProperties,
                    )}
                    onPropertyChange={props.onPropertyChange}
                    toggleDynamicProperty={props.toggleDynamicProperty}
                    openNextPanel={props.openNextPanel}
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
};

const PropertyPaneHeader = (
  props: PropertyPaneHeaderProps & PropertiesEditorPanelProps,
) => {
  if (!props.widgetProperties) return <PaneTitleWrapper />;
  return (
    <PaneTitleWrapper
      onClick={(e: any) => {
        e.stopPropagation();
      }}
    >
      {props.childProperties && props.updatePropertyTitle && (
        <StyledBackIcon onClick={props.closePanel} />
      )}
      {props.childProperties && props.updatePropertyTitle ? (
        <PropertyTitleEditor
          title={props.childProperties.label}
          updatePropertyTitle={props.updatePropertyTitle}
        />
      ) : (
        <PropertyPaneTitle
          key={props.widgetId}
          title={props.widgetProperties.widgetName}
          widgetId={props.widgetId}
        />
      )}
      <StyledToolTip
        content={
          <div>
            <span>You can connect data from your API by adding </span>
            <BindingText>{`{{apiName.data}}`}</BindingText>
            <span> to a widget property</span>
          </div>
        }
        position={Position.TOP}
        hoverOpenDelay={200}
      >
        <Icon
          style={{
            // position: "absolute",
            // right: 35,
            padding: 7,
          }}
          color={theme.colors.paneSectionLabel}
          icon="help"
        />
      </StyledToolTip>

      <CloseButton
        onClick={(e: any) => {
          props.closePanel();
          AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE_CLICK", {
            widgetType: props.widgetProperties
              ? props.widgetProperties.type
              : "",
            widgetId: props.widgetId,
          });
          props.hidePropertyPane();
          e.preventDefault();
          e.stopPropagation();
        }}
        size={theme.spaces[5]}
        color={theme.colors.paneSectionLabel}
        className={"t--property-pane-close-btn"}
      />
    </PaneTitleWrapper>
  );
};

class PropertiesEditor extends React.Component<
  IPanelProps &
    PropertiesEditorProps &
    PropertiesEditorFunctions &
    PropertiesEditorPanelProps
> {
  constructor(
    props: IPanelProps &
      PropertiesEditorProps &
      PropertiesEditorFunctions &
      PropertiesEditorPanelProps,
  ) {
    super(props);
    this.onPropertyChange = this.onPropertyChange.bind(this);
  }

  componentDidUpdate(
    prevProps: PropertiesEditorProps & PropertiesEditorFunctions,
  ) {
    if (
      this.props.widgetId !== prevProps.widgetId &&
      this.props.widgetId !== undefined
    ) {
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
    if (this.props.childProperties) {
      const {
        parentPropertyName,
        parentPropertyValue,
        id,
      } = this.props.childProperties;
      const updatedParentPropertyValue = parentPropertyValue.map(
        (item: any) => {
          if (item.id === id) {
            item[propertyName] = propertyValue;
          }
          return item;
        },
      );
      this.props.updateWidgetProperty(
        this.props.widgetId,
        parentPropertyName,
        updatedParentPropertyValue,
      );
    } else {
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
  closePropertyPane = (e: any) => {
    AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE_CLICK", {
      widgetType: this.props.widgetProperties?.type || "",
      widgetId: this.props.widgetId,
    });
    this.props.hidePropertyPane();
    e.preventDefault();
    e.stopPropagation();
  };
  openNextPanel = (childProperties: ChildProperties) => {
    console.log("childProperties", childProperties);
    const { propertySections } = childProperties;
    if (propertySections) {
      const nextPanel: IPanel<PropertiesEditorProps &
        PropertiesEditorFunctions &
        PropertiesEditorPanelProps> = {
        props: {
          isVisible: true,
          widgetProperties: this.props.widgetProperties,
          widgetId: this.props.widgetId,
          propertySections: propertySections,
          setWidgetDynamicProperty: this.props.setWidgetDynamicProperty,
          updateWidgetProperty: this.props.updateWidgetProperty,
          hidePropertyPane: this.props.hidePropertyPane,
          updatePropertyTitle: this.updatePropertyTitle,
          childProperties: {
            parentPropertyName: childProperties.parentPropertyName,
            parentPropertyValue: childProperties.parentPropertyValue,
            ...childProperties,
          },
        },
        title: "",
        component: PropertiesEditor,
      };
      this.props.openPanel(nextPanel);
    }
  };

  updatePropertyTitle = (title: string) => {
    if (this.props.childProperties) {
      const {
        parentPropertyName,
        parentPropertyValue,
        id,
      } = this.props.childProperties;
      const updatedParentPropertyValue = parentPropertyValue.map(
        (item: any) => {
          if (item.id === id) {
            item.label = title;
          }
          return item;
        },
      );
      this.props.updateWidgetProperty(
        this.props.widgetId,
        parentPropertyName,
        updatedParentPropertyValue,
      );
    }
  };

  render() {
    const { widgetProperties, propertySections, widgetId } = this.props;
    if (!widgetProperties) return <PropertyPaneWrapper />;
    return (
      <PropertyPaneWrapper
        onClick={(e: any) => {
          e.stopPropagation();
        }}
      >
        <PropertyPaneHeader
          widgetProperties={widgetProperties}
          hidePropertyPane={this.props.hidePropertyPane}
          widgetId={widgetId}
          openPanel={this.props.openPanel}
          closePanel={this.props.closePanel}
          childProperties={this.props.childProperties}
          onPropertyChange={this.onPropertyChange}
          updatePropertyTitle={this.updatePropertyTitle}
        />
        <Divider />
        {!_.isNil(propertySections)
          ? _.map(propertySections, (propertySection: PropertySection) => {
              return (
                <PropertySectionComponent
                  propertySection={propertySection}
                  id={widgetId + propertySection.id}
                  key={widgetId + propertySection.id}
                  widgetProperties={widgetProperties}
                  onPropertyChange={this.onPropertyChange}
                  toggleDynamicProperty={this.toggleDynamicProperty}
                  openNextPanel={this.openNextPanel}
                  childProperties={this.props.childProperties}
                />
              );
            })
          : undefined}
      </PropertyPaneWrapper>
    );
  }
}

interface PropertiesEditorProps {
  propertySections?: PropertySection[];
  widgetId?: string;
  widgetProperties?: WidgetProps;
  isVisible: boolean;
}

interface PropertyPaneHeaderProps extends IPanelProps {
  widgetId?: string;
  widgetProperties?: WidgetProps;
  hidePropertyPane: () => void;
  title?: React.ReactNode;
  onPropertyChange: (propertyName: string, propertyValue: any) => void;
}

interface PropertySectionComponentProps {
  propertySection: PropertySection;
  id: string;
  widgetProperties: WidgetProps;
  childProperties?: ChildProperties;
  onPropertyChange: (propertyName: string, propertyValue: any) => void;
  toggleDynamicProperty: (propertyName: string, isDynamic: boolean) => void;
  openNextPanel: (childProperties: ChildProperties) => void;
}

export interface ChildProperties {
  parentPropertyName: string;
  parentPropertyValue: any;
  propertySections?: PropertySection[];
  [key: string]: any;
}

interface PropertiesEditorPanelProps {
  childProperties?: ChildProperties;
  updatePropertyTitle?: (title: string) => void;
}

interface PropertiesEditorFunctions {
  setWidgetDynamicProperty: (
    widgetId: string,
    propertyName: string,
    isDynamic: boolean,
  ) => void;
  updateWidgetProperty: Function;
  hidePropertyPane: () => void;
}

const mapStateToProps = (state: AppState): PropertiesEditorProps => {
  return {
    propertySections: getPropertyConfig(state),
    widgetId: getCurrentWidgetId(state),
    widgetProperties: getWidgetPropsForPropertyPane(state),
    isVisible: getIsPropertyPaneVisible(state),
  };
};

const mapDispatchToProps = (dispatch: any): PropertiesEditorFunctions => {
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

export default connect(mapStateToProps, mapDispatchToProps)(PropertiesEditor);
