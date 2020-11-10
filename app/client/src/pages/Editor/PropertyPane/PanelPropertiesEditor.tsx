import React, { useCallback, useMemo } from "react";
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
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import { generatePropertyControl } from "./Generator";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import { get } from "lodash";
import { IPanelProps } from "@blueprintjs/core";

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

const updateConfigPaths = (config: PropertyPaneConfig[], basePath: string) => {
  return config.map(_childConfig => {
    const childConfig = Object.assign({}, _childConfig);
    // TODO(abhinav): Figure out a better way to differentiate between section and control
    if (
      (childConfig as PropertyPaneSectionConfig).sectionName &&
      childConfig.children
    ) {
      childConfig.children = updateConfigPaths(childConfig.children, basePath);
    } else {
      (childConfig as PropertyPaneControlConfig).propertyName = `${basePath}.${
        (childConfig as PropertyPaneControlConfig).propertyName
      }`;
    }
    return childConfig;
  });
};

export const PanelPropertiesEditor = (
  props: PanelPropertiesEditorProps &
    PanelPropertiesEditorPanelProps &
    IPanelProps,
) => {
  const dispatch = useDispatch();
  const widgetProperties: any = useSelector(getWidgetPropsForPropertyPane);
  const hidePropertyPane = useCallback(() => {
    AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE_CLICK", {
      widgetType: widgetProperties.type || "",
      widgetId: widgetProperties.widgetId,
    });
    dispatch({ type: ReduxActionTypes.HIDE_PROPERTY_PANE });
  }, [dispatch, widgetProperties.type, widgetProperties.widgetId]);

  const {
    panelConfig,
    panelProps,
    closePanel,
    panelParentPropertyPath,
  } = props;

  // TODO(abhinav): This works for arrays, not for objects
  // handle scenario where the children are object properties instead of array of objects
  const currentIndex = useMemo(() => {
    const parentProperty = get(widgetProperties, panelParentPropertyPath);
    if (parentProperty && Array.isArray(parentProperty)) {
      const currentIndex = parentProperty.findIndex(
        entry =>
          panelProps[panelConfig.panelIdPropertyName] ===
          entry[panelConfig.panelIdPropertyName],
      );
      return currentIndex;
    }
    return;
  }, [widgetProperties, panelParentPropertyPath, panelProps, panelConfig]);

  const panelConfigs = useMemo(() => {
    if (currentIndex !== undefined && currentIndex > -1) {
      const configChildren = [...panelConfig.children];
      return updateConfigPaths(
        configChildren,
        `${panelParentPropertyPath}[${currentIndex}]`,
      );
    }
  }, [currentIndex, panelConfig, panelParentPropertyPath]);
  const panel = useMemo(
    () => ({
      openPanel: props.openPanel,
      closePanel: props.closePanel,
    }),
    [props.openPanel, props.closePanel],
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
          if (panelConfig.titlePropertyName) {
            props.onPropertyChange(
              `${panelParentPropertyPath}[${currentIndex}].${panelConfig.titlePropertyName}`,
              title,
            );
          }
        }}
      />
      {panelConfigs &&
        generatePropertyControl(panelConfigs as PropertyPaneConfig[], {
          type: widgetProperties.type,
          panel,
        })}
    </>
  );
};

interface PanelPropertiesEditorProps {
  panelProps: any;
  onPropertyChange: (propertyName: string, propertyValue: any) => void;
  panelParentPropertyPath: string;
}

interface PanelPropertiesEditorPanelProps {
  panelConfig: PanelConfig;
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
