import React, { useCallback, useEffect, useMemo } from "react";
import { Button, Flex } from "design-system";
import WidgetEntity from "pages/Editor/Explorer/Widgets/WidgetEntity";
import { useSelector } from "react-redux";

import {
  getCurrentPageId,
  selectWidgetsForCurrentPage,
  selectArchivedWidgetsForCurrentPage,
} from "@appsmith/selectors/entitiesSelector";
import { getPagePermissions } from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasManagePagePermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import { EmptyState } from "../components/EmptyState";
import history from "utils/history";
import { builderURL } from "@appsmith/RouteBuilder";
import styled from "styled-components";

const ListContainer = styled(Flex)`
  & .t--entity-item {
    height: 32px;
  }

  & .t--entity-name {
    padding-left: var(--ads-v2-spaces-3);
  }

  height: 100%;
  flex-direction: column;
  gap: var(--ads-v2-spaces-3);
  overflow: hidden; // Ensure that overflow handling is consistent
  padding-top: var(--ads-v2-spaces-3);
  padding-bottom: var(--ads-v2-spaces-3);

  .widgets-container,
  .archived-widgets-container {
    flex-grow: 2;
    overflow-y: auto;
    padding-left: var(--ads-v2-spaces-3);
    padding-right: var(--ads-v2-spaces-3);
  }

  .archived-widgets-wrapper {
    flex-grow: 1;
    margin-top: var(--ads-v2-spaces-5);
    display: flex;
    flex-direction: column;
  }

  .archived-widgets-container {
    flex-grow: 1;
    overflow-y: auto;
  }
`;

const ArchivedHeader = styled.div`
  padding-left: var(--ads-v2-spaces-3);
  font-weight: lighter;
  font-size: var(--ads-canvas-widget-name-font-size);
  color: var(--ads-canvas-widget-name-color);
  flex-shrink: 0;
`;

const ListWidgets = (props: {
  setFocusSearchInput: (focusSearchInput: boolean) => void;
}) => {
  const pageId = useSelector(getCurrentPageId) as string;
  const widgets = useSelector(selectWidgetsForCurrentPage);
  const archivedWidgets = useSelector(selectArchivedWidgetsForCurrentPage);
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canManagePages = getHasManagePagePermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const widgetsInStep = useMemo(() => {
    return widgets?.children?.map((child) => child.widgetId) || [];
  }, [widgets?.children]);

  const addButtonClickHandler = useCallback(() => {
    props.setFocusSearchInput(true);
    history.push(builderURL({}));
  }, []);

  const widgetsExist =
    widgets && widgets.children && widgets.children.length > 0;

  const archivedWidgetsExist = archivedWidgets && archivedWidgets.length > 0;

  useEffect(() => {
    props.setFocusSearchInput(false);
  }, []);

  return (
    <ListContainer
      flexDirection="column"
      gap="spaces-3"
      overflow="hidden"
      py="spaces-3"
    >
      {!widgetsExist ? (
        /* If no widgets exist, show the blank state */
        <EmptyState
          buttonClassName="t--add-item"
          buttonText={createMessage(EDITOR_PANE_TEXTS.widget_add_button)}
          description={createMessage(
            EDITOR_PANE_TEXTS.widget_blank_state_description,
          )}
          icon={"widgets-v3"}
          onClick={canManagePages ? addButtonClickHandler : undefined}
        />
      ) : canManagePages ? (
        /* We show the List Add button when side by side is not enabled  */
        <Flex flexDirection="column" px="spaces-3">
          <Button
            className="t--add-item"
            kind={"secondary"}
            onClick={addButtonClickHandler}
            size={"sm"}
            startIcon={"add-line"}
          >
            {createMessage(EDITOR_PANE_TEXTS.widget_add_button)}
          </Button>
        </Flex>
      ) : null}
      {widgetsExist ? (
        <Flex
          className="widgets-container"
          data-testid="t--ide-list"
          flexDirection={"column"}
          overflowY="auto"
          px="spaces-3"
        >
          {widgets?.children?.map((child) => (
            <WidgetEntity
              childWidgets={child.children}
              key={child.widgetId}
              pageId={pageId}
              searchKeyword=""
              step={1}
              widgetId={child.widgetId}
              widgetName={child.widgetName}
              widgetType={child.type}
              widgetsInStep={widgetsInStep}
            />
          ))}
        </Flex>
      ) : null}
      {archivedWidgetsExist && (
        <Flex className="archived-widgets-wrapper">
          <ArchivedHeader>Archived Widgets</ArchivedHeader>
          <Flex className="archived-widgets-container" flexDirection={"column"}>
            {archivedWidgets?.map((widget) => (
              <WidgetEntity
                childWidgets={[
                  ...(widget.children || []),
                  ...(widget.archived || []),
                ]}
                key={widget.widgetId}
                pageId={pageId}
                searchKeyword=""
                step={1}
                widgetId={widget.widgetId}
                widgetName={widget.widgetName}
                widgetType={widget.type}
                widgetsInStep={widgetsInStep}
              />
            ))}
          </Flex>
        </Flex>
      )}
    </ListContainer>
  );
};

export default ListWidgets;
