import React, { useCallback, useEffect, useMemo } from "react";
import { Button, Flex } from "@appsmith/ads";
import WidgetEntity from "pages/Editor/Explorer/Widgets/WidgetEntity";
import { useSelector } from "react-redux";

import { selectWidgetsForCurrentPage } from "ee/selectors/entitiesSelector";
import {
  getCurrentBasePageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasManagePagePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import { EmptyState } from "../components/EmptyState";
import history from "utils/history";
import { builderURL } from "ee/RouteBuilder";
import styled from "styled-components";

const ListContainer = styled(Flex)`
  & .t--entity-item {
    height: 32px;
  }
`;

const ListWidgets = (props: {
  setFocusSearchInput: (focusSearchInput: boolean) => void;
}) => {
  const basePageId = useSelector(getCurrentBasePageId) as string;
  const widgets = useSelector(selectWidgetsForCurrentPage);
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
          data-testid="t--ide-list"
          flex="1"
          flexDirection={"column"}
          overflowY="auto"
          px="spaces-3"
        >
          {widgets?.children?.map((child) => (
            <WidgetEntity
              basePageId={basePageId}
              childWidgets={child.children}
              key={child.widgetId}
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
    </ListContainer>
  );
};

export default ListWidgets;
