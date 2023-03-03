import React, { MouseEvent, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { AppState } from "../../../ce/reducers";
import { EditorTab } from "../../../reducers/uiReducers/editorTabsReducer";
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
} from "../../../RouteBuilder";
import CloseIcon from "remixicon-react/CloseLineIcon";
import { ReduxActionTypes } from "../../../ce/constants/ReduxActionConstants";
import { indexOf } from "lodash";

const Tab = styled.div<{ isActive: boolean }>`
  display: flex;
  font-size: 13px;
  min-width: 70px;
  text-align: center;
  background-color: ${(props) => (props.isActive ? "#fff" : "#f1f1f1")};
  margin-right: 1px;
  height: 100%;
  padding: 0 15px;
  align-items: center;
  cursor: pointer;
  justify-content: space-between;
  flex-shrink: 0;
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
  overflow-x: scroll;
`;

const EditorTabs = () => {
  const tabs: Array<EditorTab> = useSelector(
    (state: AppState) => state.ui.editorTabs.openTabs,
  );
  const location = useLocation();
  const dispatch = useDispatch();
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

  const closeTab = useCallback(
    (e: MouseEvent, tab: EditorTab) => {
      e.stopPropagation();
      const tabIndex = indexOf(tabs, tab);
      if (tabIndex === 0) {
        if (tabs.length > 1) {
          navigateToTab(tabs[tabs.length - 1]);
        } else {
          navigateToTab({
            entityType: FocusEntity.CANVAS,
            name: "Canvas",
            id: "0",
          });
        }
      } else {
        navigateToTab(tabs[tabIndex - 1]);
      }
      dispatch({
        type: ReduxActionTypes.CLOSE_EDITOR_TAB,
        payload: tab,
      });
    },
    [tabs],
  );

  return (
    <TabContainer>
      {tabs.map((entity) => {
        const isActive =
          selectedEntity.entity === entity.entityType &&
          selectedEntity.id === entity.id;
        return (
          <Tab
            isActive={isActive}
            key={entity.id}
            onClick={() => navigateToTab(entity)}
          >
            {entity.name}
            {isActive && (
              <CloseIcon
                className={"ml-2"}
                onClick={(e) => closeTab(e, entity)}
                size={15}
              />
            )}
          </Tab>
        );
      })}
    </TabContainer>
  );
};

export default EditorTabs;
