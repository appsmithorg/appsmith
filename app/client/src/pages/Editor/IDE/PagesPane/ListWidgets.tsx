import React, { useCallback, useMemo } from "react";
import { Button, Flex } from "design-system";
import WidgetEntity from "pages/Editor/Explorer/Widgets/WidgetEntity";
import { useDispatch, useSelector } from "react-redux";

import {
  getCurrentPageId,
  selectWidgetsForCurrentPage,
} from "@appsmith/selectors/entitiesSelector";
import { getPagePermissions } from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasManagePagePermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { selectWidgetInitAction } from "../../../../actions/widgetSelectionActions";
import { SelectionRequestType } from "../../../../sagas/WidgetSelectUtils";

const ListWidgets = () => {
  const pageId = useSelector(getCurrentPageId) as string;
  const widgets = useSelector(selectWidgetsForCurrentPage);
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const dispatch = useDispatch();

  const canManagePages = getHasManagePagePermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const widgetsInStep = useMemo(() => {
    return widgets?.children?.map((child) => child.widgetId) || [];
  }, [widgets?.children]);

  const addButtonClickHandler = useCallback(() => {
    dispatch(selectWidgetInitAction(SelectionRequestType.Empty));
  }, [pageId]);

  return (
    <Flex
      flexDirection="column"
      gap="spaces-3"
      overflow="hidden"
      padding="spaces-3"
    >
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

      <Flex flex="1" flexDirection={"column"} gap="spaces-2" overflow="scroll">
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
    </Flex>
  );
};

export { ListWidgets };
