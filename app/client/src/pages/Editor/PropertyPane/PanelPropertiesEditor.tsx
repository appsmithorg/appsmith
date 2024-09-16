import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { WidgetProps } from "widgets/BaseWidget";
import type { PanelConfig } from "constants/PropertyControlConstants";
import PropertyControlsGenerator from "./PropertyControlsGenerator";
import {
  getSelectedPropertyPanel,
  getWidgetPropsForPropertyPane,
} from "selectors/propertyPaneSelectors";
import { get, isNumber, isPlainObject, isString } from "lodash";
import type { IPanelProps } from "@blueprintjs/core";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import PropertyPaneTitle from "./PropertyPaneTitle";
import { PropertyPaneTab } from "./PropertyPaneTab";
import styled from "styled-components";
import { updateConfigPaths, useSearchText } from "./helpers";
import { PropertyPaneSearchInput } from "./PropertyPaneSearchInput";
import { sendPropertyPaneSearchAnalytics } from "./propertyPaneSearch";
import { unsetSelectedPropertyPanel } from "actions/propertyPaneActions";

const PanelWrapper = styled.div`
  margin-top: 44px;
  display: flex;
  flex-flow: column;
`;

function PanelHeader(props: PanelHeaderProps) {
  const dispatch = useDispatch();
  const onBackClick = () => {
    dispatch(unsetSelectedPropertyPanel(props.parentPropertyPath));
    props.closePanel();
  };
  return (
    <div
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onClick={(e: any) => {
        e.stopPropagation();
      }}
    >
      <PropertyPaneTitle
        actions={[]}
        isPanelTitle
        onBackClick={onBackClick}
        title={props.title}
        updatePropertyTitle={props.updatePropertyTitle}
      />
    </div>
  );
}

export function PanelPropertiesEditor(
  props: PanelPropertiesEditorProps &
    PanelPropertiesEditorPanelProps &
    IPanelProps,
) {
  const widgetProperties = useSelector(getWidgetPropsForPropertyPane);
  const currentSelectedPanel = useSelector(getSelectedPropertyPanel);
  const keepPaneOpen = useMemo(() => {
    return Object.keys(currentSelectedPanel).some((path) => {
      return path.split(".")[0] === widgetProperties?.widgetName;
    });
  }, [currentSelectedPanel, widgetProperties?.widgetName]);

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
    if (currentIndex !== undefined && panelConfig.children) {
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

  const panelConfigsWithStyleAndContent = useMemo(() => {
    if (
      currentIndex !== undefined &&
      panelConfig.contentChildren &&
      panelConfig.styleChildren
    ) {
      let path: string | undefined = undefined;
      if (isString(currentIndex)) {
        path = `${panelParentPropertyPath}.${currentIndex}`;
      } else if (isNumber(currentIndex)) {
        path = `${panelParentPropertyPath}[${currentIndex}]`;
      }
      const contentChildren = [...panelConfig.contentChildren];
      const styleChildren = [...panelConfig.styleChildren];
      const searchConfig = [...(panelConfig.searchConfig || [])];
      return {
        content: path
          ? updateConfigPaths(contentChildren, path)
          : contentChildren,
        style: path ? updateConfigPaths(styleChildren, path) : styleChildren,
        searchConfig: path
          ? updateConfigPaths(searchConfig, path)
          : searchConfig,
      };
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
    if (panelProps.propPaneId !== widgetProperties?.widgetId || !keepPaneOpen) {
      props.closePanel();
    }
  }, [widgetProperties?.widgetId, keepPaneOpen]);

  const { searchText, setSearchText } = useSearchText("");

  /**
   * Analytics for property pane Search
   */
  useEffect(() => {
    const searchPath = `${panelParentPropertyPath}.${
      panelProps[panelConfig.panelIdPropertyName]
    }`;
    sendPropertyPaneSearchAnalytics({
      widgetType: widgetProperties?.type ?? "",
      searchText,
      widgetName: widgetProperties?.widgetName ?? "",
      searchPath,
    });
  }, [searchText]);

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

  const parentPropertyPath = `${
    widgetProperties ? `${widgetProperties.widgetName}.` : ""
  }${panelParentPropertyPath}`;

  const panelPropertyPath = `${parentPropertyPath}.${
    panelProps[panelConfig.titlePropertyName]
  }`;

  return (
    <div className="w-full overflow-y-scroll h-full">
      <PanelHeader
        closePanel={closePanel}
        isEditable={panelConfig.editableTitle}
        parentPropertyPath={parentPropertyPath}
        propertyName={panelConfig.titlePropertyName}
        title={panelProps[panelConfig.titlePropertyName]}
        updatePropertyTitle={updatePropertyTitle}
      />
      {panelConfigsWithStyleAndContent?.content ||
      panelConfigsWithStyleAndContent?.style ? (
        <>
          <PropertyPaneSearchInput isPanel onTextChange={setSearchText} />
          {searchText.length > 0 ? (
            <PanelWrapper>
              <PropertyControlsGenerator
                config={panelConfigsWithStyleAndContent.searchConfig}
                id={widgetProperties.widgetId}
                panel={panel}
                panelPropertyPath={panelPropertyPath}
                searchQuery={searchText}
                theme={theme}
                type={widgetProperties.type}
              />
            </PanelWrapper>
          ) : (
            <PropertyPaneTab
              contentComponent={
                panelConfigsWithStyleAndContent?.content.length > 0 ? (
                  <PanelWrapper>
                    <PropertyControlsGenerator
                      config={panelConfigsWithStyleAndContent.content}
                      id={widgetProperties.widgetId}
                      isPanelProperty
                      panel={panel}
                      panelPropertyPath={panelPropertyPath}
                      theme={theme}
                      type={widgetProperties.type}
                    />
                  </PanelWrapper>
                ) : null
              }
              isPanelProperty
              panelPropertyPath={panelPropertyPath}
              styleComponent={
                panelConfigsWithStyleAndContent.style.length > 0 ? (
                  <PanelWrapper>
                    <PropertyControlsGenerator
                      config={panelConfigsWithStyleAndContent.style}
                      id={widgetProperties.widgetId}
                      isPanelProperty
                      panel={panel}
                      panelPropertyPath={panelPropertyPath}
                      theme={theme}
                      type={widgetProperties.type}
                    />
                  </PanelWrapper>
                ) : null
              }
            />
          )}
        </>
      ) : (
        panelConfigs && (
          <PanelWrapper>
            <PropertyControlsGenerator
              config={panelConfigs}
              id={widgetProperties.widgetId}
              isPanelProperty
              panel={panel}
              panelPropertyPath={panelPropertyPath}
              theme={theme}
              type={widgetProperties.type}
            />
          </PanelWrapper>
        )
      )}
    </div>
  );
}

interface PanelPropertiesEditorProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  parentPropertyPath: string;
  title: string;
  closePanel: () => void;
  propertyName: string;
  updatePropertyTitle: (title: string) => void;
}

export default PanelPropertiesEditor;
