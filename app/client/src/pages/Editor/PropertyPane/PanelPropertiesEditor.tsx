import React, { useCallback } from "react";
import styled, { AnyStyledComponent } from "styled-components";
import { useDispatch, useSelector } from "react-redux";

import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyTitleEditor from "pages/Editor/PropertyPane/PropertyTitleEditor";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { ControlIcons } from "icons/ControlIcons";
import {
  PanelConfig,
  PropertyPaneConfig,
} from "constants/PropertyControlConstants";
import { generatePropertyControl } from "./Generator";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";

const PaneTitleWrapper = styled.div`
  align-items: center;
  background-color: ${props => props.theme.colors.paneBG};
  color: ${props => props.theme.colors.textOnDarkBG};
  padding-bottom: 12px;
  display: grid;
  grid-template-columns: 20px 1fr;
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

const PanelHeader = (props: PanelHeaderProps) => {
  return (
    <PaneTitleWrapper
      onClick={(e: any) => {
        e.stopPropagation();
      }}
    >
      <StyledBackIcon onClick={props.closePanel} />
      <PropertyTitleEditor
        title={props.title}
        updatePropertyTitle={props.updatePropertyTitle}
        onClose={props.hidePropertyPane}
      />
    </PaneTitleWrapper>
  );
};

export const PanelPropertiesEditor = (
  props: PanelPropertiesEditorProps & PanelPropertiesEditorPanelProps,
) => {
  const dispatch = useDispatch();
  const widgetProperties: any = useSelector(getWidgetPropsForPropertyPane);
  const hidePropertyPane = useCallback(() => {
    AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE_CLICK", {
      widgetType: widgetProperties.type || "",
      widgetId: widgetProperties.widgetId,
    });
    dispatch({ type: ReduxActionTypes.HIDE_PROPERTY_PANE });
  }, [dispatch]);

  const { panelConfig, panelProps, closePanel } = props;

  const onPropertyChange = useCallback(
    (propertyName: string, propertyValue: any) => {
      if (props.panelProps) {
        props.onPropertyChange(
          `${
            props.panelProps[panelConfig.panelIdPropertyName]
          }.${propertyName}`,
          propertyValue,
        );
      }
    },
    [
      props.onPropertyChange,
      props.panelProps,
      props.panelConfig.panelIdPropertyName,
    ],
  );
  if (!widgetProperties) return null;

  return (
    <>
      <PanelHeader
        isEditable={panelConfig.editableTitle}
        propertyName={panelConfig.titlePropertyName}
        hidePropertyPane={hidePropertyPane}
        closePanel={closePanel}
        title={panelProps[panelConfig.titlePropertyName]}
        updatePropertyTitle={(title: string) => {
          if (props.panelProps) {
            props.onPropertyChange(
              `${props.panelProps[panelConfig.panelIdPropertyName]}.${
                panelConfig.titlePropertyName
              }`,
              title,
            );
          }
        }}
      />
      {generatePropertyControl(
        panelConfig.children as PropertyPaneConfig[],
        {
          ...panelProps,
          ...widgetProperties,
        },
        onPropertyChange,
      )}
    </>
  );
};

interface PanelPropertiesEditorProps {
  panelProps: any;
  onPropertyChange: (propertyName: string, propertyValue: any) => void;
}

interface PanelPropertiesEditorPanelProps {
  panelConfig: PanelConfig;
  closePanel: () => void;
}

interface PanelHeaderProps {
  isEditable: boolean;
  widgetProperties?: WidgetProps;
  hidePropertyPane: () => void;
  title: string;
  closePanel: () => void;
  propertyName: string;
  updatePropertyTitle: (title: string) => void;
}

export default PanelPropertiesEditor;
