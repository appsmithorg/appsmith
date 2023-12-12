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
import history from "utils/history";
import { ADD_PATH } from "constants/routes";

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
    history.push(`${location.pathname}${ADD_PATH}`);
  }, [pageId]);

  return (
    <Flex flexDirection="column" gap="spaces-3" padding="spaces-4">
      {canManagePages && (
        <Button
          kind={"secondary"}
          onClick={addButtonClickHandler}
          size={"sm"}
          startIcon={"add-line"}
        >
          New Widget
        </Button>
      )}

      <Flex flexDirection={"column"}>
        {widgets?.children?.map((child) => (
          <WidgetEntity
            childWidgets={child.children}
            key={child.widgetId}
            pageId={pageId}
            searchKeyword=""
            step={2}
            widgetId={child.widgetId}
            widgetName={child.widgetName}
            widgetType={child.type}
            widgetsInStep={widgetsInStep}
          />
        ))}
      </Flex>
    </Flex>
  );
};

export { ListWidgets };
