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
import { createMessage, PAGES_PANE_TEXTS } from "@appsmith/constants/messages";
import { EmptyState } from "./EmptyState";
import history from "utils/history";
import { builderURL } from "@appsmith/RouteBuilder";

const ListWidgets = () => {
  const pageId = useSelector(getCurrentPageId) as string;
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
    history.push(builderURL({ pageId }));
  }, [pageId]);

  return (
    <Flex flexDirection="column" gap="spaces-4" overflow="hidden" py="spaces-3">
      {widgets &&
        widgets.children &&
        widgets.children.length > 0 &&
        canManagePages && (
          <Flex flexDirection="column" px="spaces-3">
            <Button
              className="t--add-item"
              kind={"secondary"}
              onClick={addButtonClickHandler}
              size={"sm"}
              startIcon={"add-line"}
            >
              {createMessage(PAGES_PANE_TEXTS.widget_add_button)}
            </Button>
          </Flex>
        )}
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
      {(!widgets || !widgets.children || widgets?.children?.length === 0) && (
        <EmptyState
          buttonClassName={"t--add-item"}
          buttonText={createMessage(PAGES_PANE_TEXTS.widget_add_button)}
          description={createMessage(
            PAGES_PANE_TEXTS.widget_blank_state_description,
          )}
          icon={"widgets-v3"}
          onClick={canManagePages ? addButtonClickHandler : undefined}
        />
      )}
    </Flex>
  );
};

export { ListWidgets };
