import React, { useCallback } from "react";
import styled, { AnyStyledComponent } from "styled-components";
import _, { noop } from "lodash";
import { useDispatch } from "react-redux";

import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { scrollbarDark } from "constants/DefaultTheme";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyTitleEditor from "pages/Editor/PropertyPane/PropertyTitleEditor";
import AnalyticsUtil from "utils/AnalyticsUtil";
import PaneWrapper from "pages/common/PaneWrapper";
import { ControlIcons } from "icons/ControlIcons";
import {
  PanelConfig,
  PropertyPaneConfig,
} from "constants/PropertyControlConstants";
import { generatePropertyControl } from "./Generator";

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
        updatePropertyTitle={noop}
        onClose={props.hidePropertyPane}
      />
    </PaneTitleWrapper>
  );
};

export const PropertiesEditor = (
  props: PropertiesEditorProps & PropertiesEditorPanelProps,
) => {
  const dispatch = useDispatch();
  const hidePropertyPane = useCallback(() => {
    AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE_CLICK", {
      widgetType: props.widgetProperties.type || "",
      widgetId: props.widgetProperties.widgetId,
    });
    dispatch({ type: ReduxActionTypes.HIDE_PROPERTY_PANE });
  }, [dispatch]);

  const { panelConfig, widgetProperties, panelProps, closePanel } = props;
  if (!widgetProperties) return null;
  return (
    <>
      <PanelHeader
        isEditable={panelConfig.editableTitle}
        propertyName={panelConfig.titlePropertyName}
        hidePropertyPane={hidePropertyPane}
        closePanel={closePanel}
        title={panelProps[panelConfig.titlePropertyName]}
      />
      {generatePropertyControl(panelConfig.children as PropertyPaneConfig[], {
        ...panelProps,
        ...widgetProperties,
      })}
    </>
  );
};

interface PropertiesEditorProps {
  widgetProperties: WidgetProps;
  panelProps: any;
}

interface PropertiesEditorPanelProps {
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
}

export default PropertiesEditor;
