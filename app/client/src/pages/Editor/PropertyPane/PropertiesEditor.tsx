import React from "react";
import styled, { AnyStyledComponent } from "styled-components";
import _ from "lodash";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { Divider, IPanel, IPanelProps } from "@blueprintjs/core";
import {
  getCurrentWidgetId,
  getIsPropertyPaneVisible,
  getWidgetPropsForPropertyPane,
  getWidgetChildPropertiesForPropertyPane,
} from "selectors/propertyPaneSelectors";
import {
  updateWidgetPropertyRequest,
  setWidgetDynamicProperty,
} from "actions/controlActions";
import { RenderModes } from "constants/WidgetConstants";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { ControlProps } from "components/propertyControls/BaseControl";
import { scrollbarDark } from "constants/DefaultTheme";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyPaneTitle from "pages/Editor/PropertyPaneTitle";
import PropertyTitleEditor from "pages/Editor/PropertyPane/PropertyTitleEditor";
import PropertyControl from "pages/Editor/PropertyPane/PropertyControl";
import AnalyticsUtil from "utils/AnalyticsUtil";
import PaneWrapper from "pages/common/PaneWrapper";
import { ControlIcons } from "icons/ControlIcons";
import CollapseComponent from "components/utils/CollapseComponent";
import {
  PanelConfig,
  PropertyPaneConfig,
} from "constants/PropertyControlConstants";
import { generatePropertyControl } from "./Generator";

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
  width: calc(100% - 6px);
  max-height: ${props => props.theme.propertyPane.height}px;
  width: ${props => props.theme.propertyPane.width}px;
  box-shadow: 0px 0px 10px ${props => props.theme.colors.paneCard};
  border-right: 0;
  overflow-y: auto;
  overflow-x: hidden;
  text-transform: none;
  ${scrollbarDark};
  padding: 0;
`;
//border: ${props => props.theme.spaces[5]}px solid ${props => props.theme.colors.paneBG};
//padding: 0 ${props => props.theme.spaces[2]}px 0 0;

const PaneTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: ${props => props.theme.colors.paneBG};
  color: ${props => props.theme.colors.textOnDarkBG};
  padding: 12px;
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

// const PropertySectionComponent = (props: PropertySectionComponentProps) => {
//   const { id, widgetProperties } = props;
//   // <CollapseComponent title={propertySection.sectionName} />
//   return (
//     <div key={id}>
//       <CollapseComponent
//         title={
//           !_.isNil(propertySection) ? propertySection.sectionName : undefined
//         }
//       >
//         {_.map(
//           propertySection.children,
//           (propertyControlOrSection: ControlProps) => {
//             if ("children" in propertyControlOrSection) {
//               return (
//                 <PropertySectionComponent
//                   id={propertyControlOrSection.id}
//                   widgetProperties={widgetProperties}
//                   onPropertyChange={props.onPropertyChange}
//                   toggleDynamicProperty={props.toggleDynamicProperty}
//                   openNextPanel={props.openNextPanel}
//                   childProperties={props.childProperties}
//                 />
//               );
//             } else if (widgetProperties) {
//               try {
//                 return (
//                   <PropertyControl
//                     key={propertyControlOrSection.id}
//                     widgetProperties={_.merge(
//                       widgetProperties,
//                       props.childProperties,
//                     )}
//                     toggleDynamicProperty={props.toggleDynamicProperty}
//                     openNextPanel={props.openNextPanel}
//                   />
//                 );
//               } catch (e) {
//                 console.log(e);
//               }
//             }
//           },
//         )}
//       </CollapseComponent>
//     </div>
//   );
// };

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
      {/* {props.childProperties && props.updatePropertyTitle && (
        <StyledBackIcon onClick={props.closePanel} />
      )}
      {props.childProperties && props.updatePropertyTitle ? (
        <PropertyTitleEditor
          title={props.childProperties.label}
          updatePropertyTitle={props.updatePropertyTitle}
          widgetType={props.widgetProperties?.type}
          onClose={props.hidePropertyPane}
          widgetId={props.widgetId}
        />
      ) : (
        <PropertyPaneTitle
          key={props.widgetId}
          title={props.widgetProperties.widgetName}
          widgetId={props.widgetId}
          widgetType={props.widgetProperties?.type}
          onClose={props.hidePropertyPane}
        />
      )} */}
    </PaneTitleWrapper>
  );
};

export class PropertiesEditor extends React.Component<
  PropertiesEditorProps & PropertiesEditorPanelProps
> {
  // constructor(
  //   props: IPanelProps &
  //     PropertiesEditorProps &
  //     PropertiesEditorFunctions &
  //     PropertiesEditorPanelProps,
  // ) {
  //   super(props);
  //   // this.onPropertyChange = this.onPropertyChange.bind(this);
  // }

  componentDidUpdate(prevProps: PropertiesEditorProps) {
    // console.log("props", prevProps, this.props);
    // if (
    //   this.props.widgetProperties.widgetId !==
    //     prevProps.widgetProperties.widgetId &&
    //   this.props.widgetProperties.widgetId !== undefined
    // ) {
    //   if (prevProps.widgetProperties.widgetId && prevProps.widgetProperties) {
    //     AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE", {
    //       widgetType: prevProps.widgetProperties.type,
    //       widgetId: prevProps.widgetProperties.widgetId,
    //     });
    //   }
    //   if (this.props.widgetProperties) {
    //     AnalyticsUtil.logEvent("PROPERTY_PANE_OPEN", {
    //       widgetType: this.props.widgetProperties.type,
    //       widgetId: this.props.widgetProperties.widgetId,
    //     });
    //   }
    // }

    // if (
    //   this.props.widgetProperties.widgetId === prevProps.widgetProperties.widgetId &&
    //   this.props.isVisible &&
    //   !prevProps.isVisible &&
    //   this.props.widgetProperties !== undefined
    // ) {
    //   AnalyticsUtil.logEvent("PROPERTY_PANE_OPEN", {
    //     widgetType: this.props.widgetProperties.type,
    //     widgetId: this.props.widgetId,
    //   });
    // }

    return true;
  }
  // onPropertyChange(propertyName: string, propertyValue: any) {
  //   console.log(propertyName, propertyValue, this.props.childProperties);
  //   if (this.props.childProperties) {
  //     const {
  //       parentPropertyName,
  //       parentPropertyValue,
  //       id,
  //     } = this.props.childProperties;
  //     let updatedParentPropertyValue = [...parentPropertyValue];
  //     updatedParentPropertyValue = updatedParentPropertyValue.map(
  //       (item: any) => {
  //         if (item.id === id) {
  //           // item[propertyName] = propertyValue;
  //           return {
  //             ...item,
  //             [propertyName]: propertyValue,
  //           };
  //         }
  //         return item;
  //       },
  //     );
  //     console.log("updatedParentPropertyValue", updatedParentPropertyValue);
  //     this.props.updateWidgetProperty(
  //       this.props.widgetId,
  //       parentPropertyName,
  //       updatedParentPropertyValue,
  //     );
  //   } else {
  //     this.props.updateWidgetProperty(
  //       this.props.widgetId,
  //       propertyName,
  //       propertyValue,
  //     );
  //     if (this.props.widgetProperties) {
  //       AnalyticsUtil.logEvent("WIDGET_PROPERTY_UPDATE", {
  //         widgetType: this.props.widgetProperties.type,
  //         widgetName: this.props.widgetProperties.widgetName,
  //         propertyName: propertyName,
  //         updatedValue: propertyValue,
  //       });
  //     }
  //   }
  // }
  // toggleDynamicProperty = (propertyName: string, isDynamic: boolean) => {
  //   const { widgetId } = this.props.widgetProperties;
  //   this.props.setWidgetDynamicProperty(
  //     widgetId as string,
  //     propertyName,
  //     !isDynamic,
  //   );
  //   if (this.props.widgetProperties) {
  //     AnalyticsUtil.logEvent("WIDGET_TOGGLE_JS_PROP", {
  //       widgetType: this.props.widgetProperties.type,
  //       widgetName: this.props.widgetProperties.widgetName,
  //       propertyName: propertyName,
  //       propertyState: !isDynamic ? "JS" : "NORMAL",
  //     });
  //   }
  // };
  // closePropertyPane = (e: any) => {
  //   AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE_CLICK", {
  //     widgetType: this.props.widgetProperties?.type || "",
  //     widgetId: this.props.widgetProperties.widgetId,
  //   });
  //   this.props.hidePropertyPane();
  //   e.preventDefault();
  //   e.stopPropagation();
  // };
  // openNextPanel = (childProperties: ChildProperties) => {
  //   console.log("childProperties", childProperties);
  //   const { propertySections } = childProperties;
  //   if (propertySections) {
  //     const nextPanel: IPanel<PropertiesEditorProps &
  //       PropertiesEditorFunctions &
  //       PropertiesEditorPanelProps> = {
  //       props: {
  //         isVisible: true,
  //         widgetProperties: this.props.widgetProperties,
  //         widgetId: this.props.widgetId,
  //         propertySections: propertySections,
  //         setWidgetDynamicProperty: this.props.setWidgetDynamicProperty,
  //         updateWidgetProperty: this.props.updateWidgetProperty,
  //         hidePropertyPane: this.props.hidePropertyPane,
  //         updatePropertyTitle: this.updatePropertyTitle,
  //         openChildPaneProperties: this.props.openChildPaneProperties,
  //         childProperties: {
  //           parentPropertyName: childProperties.parentPropertyName,
  //           parentPropertyValue: childProperties.parentPropertyValue,
  //           id: childProperties.id,
  //           label: childProperties.label,
  //         },
  //       },
  //       component: ConnectedPropertiesEditor,
  //     };
  //     this.props.openChildPaneProperties(
  //       this.props.widgetId || "",
  //       childProperties.parentPropertyName,
  //       childProperties.id,
  //     );
  //     this.props.openPanel(nextPanel);
  //   }
  // };

  updatePropertyTitle = (title: string) => {
    // if (this.props.childProperties) {
    //   const {
    //     parentPropertyName,
    //     parentPropertyValue,
    //     id,
    //   } = this.props.childProperties;
    //   const updatedParentPropertyValue = parentPropertyValue.map(
    //     (item: any) => {
    //       if (item.id === id) {
    //         item.label = title;
    //       }
    //       return item;
    //     },
    //   );
    //   this.props.updateWidgetProperty(
    //     this.props.widgetId,
    //     parentPropertyName,
    //     updatedParentPropertyValue,
    //   );
    // }
  };

  render() {
    const { panelConfig, widgetProperties, panelProps } = this.props;
    if (!widgetProperties) return <PropertyPaneWrapper />;
    return (
      <PropertyPaneWrapper
        onClick={(e: any) => {
          e.stopPropagation();
        }}
      >
        {/* <PropertyPaneHeader
          widgetProperties={widgetProperties}
          hidePropertyPane={this.props.hidePropertyPane}
          widgetId={widgetId}
          openPanel={this.props.openPanel}
          closePanel={this.props.closePanel}
          onPropertyChange={this.onPropertyChange}
        /> */}
        {generatePropertyControl(panelConfig.children as PropertyPaneConfig[], {
          ...panelProps,
          ...widgetProperties,
        })}
      </PropertyPaneWrapper>
    );
  }
}

interface PropertiesEditorProps {
  widgetProperties: WidgetProps;
  panelProps: any;
}

interface PropertiesEditorPanelProps {
  panelConfig: PanelConfig;
}

interface PropertyPaneHeaderProps extends IPanelProps {
  widgetId?: string;
  widgetProperties?: WidgetProps;
  hidePropertyPane: () => void;
  title?: React.ReactNode;
  onPropertyChange: (propertyName: string, propertyValue: any) => void;
}

// interface PropertiesEditorFunctions {
//   setWidgetDynamicProperty: (
//     widgetId: string,
//     propertyName: string,
//     isDynamic: boolean,
//   ) => void;
//   updateWidgetProperty: Function;
//   hidePropertyPane: () => void;
//   openChildPaneProperties: (
//     widgetId: string,
//     propertyControlId: string,
//     widgetChildProperty: string,
//   ) => void;
// }

// const mapDispatchToProps = (dispatch: any): PropertiesEditorFunctions => {
//   return {
//     updateWidgetProperty: (
//       widgetId: string,
//       propertyName: string,
//       propertyValue: any,
//     ) =>
//       dispatch(
//         updateWidgetPropertyRequest(
//           widgetId,
//           propertyName,
//           propertyValue,
//           RenderModes.CANVAS,
//         ),
//       ),
//     hidePropertyPane: () =>
//       dispatch({
//         type: ReduxActionTypes.HIDE_PROPERTY_PANE,
//       }),
//     setWidgetDynamicProperty: (
//       widgetId: string,
//       propertyName: string,
//       isDynamic: boolean,
//     ) => dispatch(setWidgetDynamicProperty(widgetId, propertyName, isDynamic)),
//     openChildPaneProperties: (
//       widgetId: string,
//       propertyControlId: string,
//       widgetChildProperty: string,
//     ) =>
//       dispatch({
//         type: ReduxActionTypes.OPEN_SUB_PANE,
//         payload: {
//           widgetId,
//           propertyControlId,
//           widgetChildProperty,
//         },
//       }),
//   };
// };

// const ConnectedPropertiesEditor = connect(
//   mapStateToProps,
//   mapDispatchToProps,
// )(PropertiesEditor);

export default PropertiesEditor;
