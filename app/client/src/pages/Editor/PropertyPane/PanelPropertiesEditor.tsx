import React, { useCallback, useEffect, useMemo } from "react";
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
import { IPanelProps } from "@blueprintjs/core";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import PropertyPaneTitle from "../PropertyPaneTitle";
import { BindingText } from "../APIEditor/Form";
import { PropertyControlsWrapper, PropertyPaneBodyWrapper } from ".";
import { ControlIcons } from "icons/ControlIcons";

const QuestionIcon = ControlIcons.QUESTION;
const CloseIcon = ControlIcons.CLOSE_CONTROL;

function PanelHeader(props: PanelHeaderProps) {
  return (
    <div
      onClick={(e: any) => {
        e.stopPropagation();
      }}
    >
      <PropertyPaneTitle
        actions={[
          {
            tooltipContent: (
              <div>
                <span>You can connect data from your API by adding </span>
                <BindingText>{`{{apiName.data}}`}</BindingText>
                <span> to a widget property</span>
              </div>
            ),
            icon: <QuestionIcon height={16} width={16} />,
          },
          {
            tooltipContent: "Close",
            icon: (
              <CloseIcon
                className={"t--property-pane-close-btn"}
                height={16}
                onClick={(e: any) => {
                  props.hidePropertyPane();
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
            ),
          },
        ]}
        isPanelTitle
        onBackClick={props.closePanel}
        title={props.title}
        updatePropertyTitle={props.updatePropertyTitle}
      />
    </div>
  );
}

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

export function PanelPropertiesEditor(
  props: PanelPropertiesEditorProps &
    PanelPropertiesEditorPanelProps &
    IPanelProps,
) {
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
    closePanel,
    panelConfig,
    panelParentPropertyPath,
    panelProps,
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
    if (currentIndex !== undefined) {
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

  useEffect(() => {
    if (panelProps.propPaneId !== widgetProperties.widgetId) {
      props.closePanel();
    }
  }, [widgetProperties.widgetId]);

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
        closePanel={closePanel}
        hidePropertyPane={hidePropertyPane}
        isEditable={panelConfig.editableTitle}
        propertyName={panelConfig.titlePropertyName}
        title={panelProps[panelConfig.titlePropertyName]}
        updatePropertyTitle={updatePropertyTitle}
      />
      <PropertyPaneBodyWrapper>
        <PropertyControlsWrapper>
          {panelConfigs &&
            generatePropertyControl(panelConfigs as PropertyPaneConfig[], {
              id: widgetProperties.widgetId,
              type: widgetProperties.type,
              panel,
              theme,
            })}
        </PropertyControlsWrapper>
      </PropertyPaneBodyWrapper>
    </>
  );
}

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
