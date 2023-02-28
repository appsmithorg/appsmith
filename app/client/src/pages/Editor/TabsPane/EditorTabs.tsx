import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { AppState } from "../../../ce/reducers";
import { EditorTab } from "../../../reducers/uiReducers/editorTabsReducer";
import { getSelectedWidget } from "../../../sagas/selectors";
import {
  FocusEntity,
  identifyEntityFromPath,
} from "../../../navigation/FocusEntity";
import { useLocation } from "react-router-dom";
import history from "utils/history";
import {
  apiEditorIdURL,
  builderURL,
  datasourcesEditorIdURL,
  jsCollectionIdURL,
  queryEditorIdURL,
  widgetURL,
} from "../../../RouteBuilder";

const Tab = styled.div<{ isActive: boolean }>`
  display: flex;
  font-size: 13px;
  min-width: 50px;
  text-align: center;
  background-color: ${(props) => (props.isActive ? "#fff" : "#f1f1f1")};
  margin-right: 1px;
  height: 100%;
  padding: 0 15px;
  align-items: center;
  cursor: pointer;
  &:hover {
    background-color: #fff;
  }
`;

const TabContainer = styled.div`
  display: flex;
  height: 50px;
  align-items: center;
  border-bottom: 1px solid #e8e8e8;
  background-color: #f1f1f1;
`;

const EditorTabs = () => {
  const tabs: Array<EditorTab> = useSelector(
    (state: AppState) => state.ui.editorTabs.openTabs,
  );
  const selectedWidget = useSelector(getSelectedWidget);
  const location = useLocation();
  const selectedEntity = identifyEntityFromPath(location.pathname);

  const navigateToTab = useCallback((entity: EditorTab) => {
    if (!selectedEntity.pageId) return;
    switch (entity.entityType) {
      case FocusEntity.API:
        history.push(
          apiEditorIdURL({ apiId: entity.id, pageId: selectedEntity.pageId }),
        );
        break;
      case FocusEntity.QUERY:
        history.push(
          queryEditorIdURL({
            queryId: entity.id,
            pageId: selectedEntity.pageId,
          }),
        );
        break;

      case FocusEntity.JS_OBJECT:
        history.push(
          jsCollectionIdURL({
            collectionId: entity.id,
            pageId: selectedEntity.pageId,
          }),
        );
        break;
      case FocusEntity.PROPERTY_PANE:
        history.push(
          widgetURL({
            selectedWidgets: [entity.id],
            pageId: selectedEntity.pageId,
          }),
        );
        break;
      case FocusEntity.DATASOURCE:
        history.push(
          datasourcesEditorIdURL({
            datasourceId: entity.id,
            pageId: selectedEntity.pageId,
          }),
        );
        break;
      case FocusEntity.CANVAS:
        history.push(builderURL({ pageId: selectedEntity.pageId }));
    }
  }, []);

  return (
    <TabContainer>
      <Tab
        isActive={
          (selectedEntity.entity === FocusEntity.PROPERTY_PANE &&
            selectedEntity.id === selectedWidget?.widgetId) ||
          selectedEntity.entity === FocusEntity.CANVAS
        }
        key={selectedWidget?.widgetId || "Canvas"}
        onClick={() => {
          if (!selectedWidget || selectedWidget.widgetId === "0") {
            navigateToTab({
              id: "",
              entityType: FocusEntity.CANVAS,
              name: "Canvas",
            });
          }
          if (selectedWidget?.widgetId) {
            navigateToTab({
              id: selectedWidget.widgetId,
              entityType: FocusEntity.PROPERTY_PANE,
              name: selectedWidget.widgetName,
            });
          }
        }}
      >
        {selectedEntity.entity === FocusEntity.CANVAS ||
        selectedWidget?.widgetId === "0"
          ? "Canvas"
          : selectedWidget
          ? selectedWidget.widgetName
          : "Canvas"}
      </Tab>
      {tabs.map((entity) => (
        <Tab
          isActive={
            selectedEntity.entity === entity.entityType &&
            selectedEntity.id === entity.id
          }
          key={entity.id}
          onClick={() => navigateToTab(entity)}
        >
          {entity.name}
        </Tab>
      ))}
    </TabContainer>
  );
};

export default EditorTabs;
