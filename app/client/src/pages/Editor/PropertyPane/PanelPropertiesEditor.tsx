import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  PanelConfig,
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import { generatePropertyControl } from "./Generator";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import { get, isNumber, isPlainObject, isString } from "lodash";
import { Icon, IPanelProps } from "@blueprintjs/core";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import PropertyPaneTitle from "../PropertyPaneTitle";
import { BindingText } from "../APIEditor/Form";

const PanelHeader = (props: PanelHeaderProps) => {
  return (
    <div
      onClick={(e: any) => {
        e.stopPropagation();
      }}
    >
      <PropertyPaneTitle
        title={props.title}
        updatePropertyTitle={props.updatePropertyTitle}
        onBackClick={props.closePanel}
        isPanelTitle={true}
        actions={[
          {
            tooltipContent: (
              <div>
                <span>You can connect data from your API by adding </span>
                <BindingText>{`{{apiName.data}}`}</BindingText>
                <span> to a widget property</span>
              </div>
            ),
            icon: <Icon icon="help" iconSize={16} />,
          },
          {
            tooltipContent: "Close",
            icon: (
              <Icon
                onClick={(e: any) => {
                  props.hidePropertyPane();
                  e.preventDefault();
                  e.stopPropagation();
                }}
                iconSize={16}
                icon="cross"
                className={"t--property-pane-close-btn"}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

const updateConfigPaths = (config: PropertyPaneConfig[], basePath: string) => {
  return config.map((_childConfig) => {
    const childConfig = Object.assign({}, _childConfig);
    // TODO(abhinav): Figure out a better way to differentiate between section and control
    if (
      (childConfig as PropertyPaneSectionConfig).sectionName &&
      childConfig.children
    ) {
      (childConfig as PropertyPaneSectionConfig).propertySectionPath = basePath;
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
    theme,
  } = props;

  // This could be the id of the parent to access the path
  // For example: `someProperty[<thisValue>]`
  // or the index of the parent to access the path
  // For example: `someProperty.<thisValue>`
  const currentIndex = useMemo(() => {
    const parentProperty = get(widgetProperties, panelParentPropertyPath);
    if (parentProperty) {
      if (isPlainObject(parentProperty)) {
        return panelProps[panelConfig.panelIdPropertyName];
      } else if (Array.isArray(parentProperty)) {
        const currentIndex = parentProperty.findIndex(
          (entry) =>
            panelProps[panelConfig.panelIdPropertyName] ===
            entry[panelConfig.panelIdPropertyName],
        );
        return currentIndex;
      }
    }
    return;
  }, [widgetProperties, panelParentPropertyPath, panelProps, panelConfig]);

  const panelConfigs = useMemo(() => {
    if (currentIndex) {
      let path: string | undefined = undefined;
      if (isString(currentIndex)) {
        path = `${panelParentPropertyPath}.${currentIndex}`;
      } else if (isNumber(currentIndex)) {
        path = `${panelParentPropertyPath}[${currentIndex}]`;
      }
      const configChildren = [...panelConfig.children];
      return path ? updateConfigPaths(configChildren, path) : configChildren;
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
  const updatePropertyTitle = (title: string) => {
    if (panelConfig.titlePropertyName) {
      const propertiesToUpdate: Record<string, unknown> = {};
      let path: string | undefined = undefined;
      if (isString(currentIndex)) {
        path = `${panelParentPropertyPath}.${currentIndex}.${panelConfig.titlePropertyName}`;
      } else if (isNumber(currentIndex)) {
        path = `${panelParentPropertyPath}[${currentIndex}].${panelConfig.titlePropertyName}`;
      }
      if (path) {
        propertiesToUpdate[path] = title;
        if (panelConfig.updateHook) {
          const additionalPropertiesToUpdate = panelConfig.updateHook(
            widgetProperties,
            path,
            title,
          );
          additionalPropertiesToUpdate?.forEach(
            ({ propertyPath, propertyValue }) => {
              propertiesToUpdate[propertyPath] = propertyValue;
            },
          );
        }
        props.onPropertiesChange(propertiesToUpdate);
      }
    }
  };
  return (
    <>
      <PanelHeader
        isEditable={panelConfig.editableTitle}
        propertyName={panelConfig.titlePropertyName}
        hidePropertyPane={hidePropertyPane}
        closePanel={closePanel}
        title={panelProps[panelConfig.titlePropertyName]}
        updatePropertyTitle={updatePropertyTitle}
      />
      {panelConfigs &&
        generatePropertyControl(panelConfigs as PropertyPaneConfig[], {
          type: widgetProperties.type,
          panel,
          theme,
        })}
    </>
  );
};

interface PanelPropertiesEditorProps {
  panelProps: any;
  onPropertiesChange: (updates: Record<string, unknown>) => void;
  panelParentPropertyPath: string;
  theme: EditorTheme;
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
