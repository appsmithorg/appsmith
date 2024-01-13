import React, { useCallback, useMemo } from "react";
import { Button, Flex } from "design-system";
import WidgetEntity from "pages/Editor/Explorer/Widgets/WidgetEntity";
import { useSelector } from "react-redux";

import {
  getCurrentPageId,
  selectWidgetsForCurrentPage,
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
import { getIsSideBySideEnabled } from "selectors/ideSelectors";

const ListContainer = styled(Flex)`
  & .t--entity-item {
    height: 32px;
    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const ListWidgets = () => {
  const pageId = useSelector(getCurrentPageId) as string;
  const widgets = useSelector(selectWidgetsForCurrentPage);
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);

  const canManagePages = getHasManagePagePermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const widgetsInStep = useMemo(() => {
    return widgets?.children?.map((child) => child.widgetId) || [];
  }, [widgets?.children]);

  const addButtonClickHandler = useCallback(() => {
    history.push(builderURL({}));
  }, []);

  const widgetsExist =
    widgets && widgets.children && widgets.children.length > 0;

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
      ) : canManagePages && !isSideBySideEnabled ? (
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
        <Flex flex="1" flexDirection={"column"} overflowY="auto" px="spaces-3">
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
    </ListContainer>
  );
};

export default ListWidgets;
