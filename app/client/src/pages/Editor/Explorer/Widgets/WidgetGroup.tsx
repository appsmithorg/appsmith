import React, { memo, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import Entity from "../Entity";
import WidgetEntity from "./WidgetEntity";
import {
  getCurrentApplicationId,
  getCurrentBasePageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import {
  ADD_WIDGET_BUTTON,
  ADD_WIDGET_TOOLTIP,
  createMessage,
  EMPTY_WIDGET_BUTTON_TEXT,
  EMPTY_WIDGET_MAIN_TEXT,
} from "ee/constants/messages";
import { selectWidgetsForCurrentPage } from "ee/selectors/entitiesSelector";
import {
  getExplorerStatus,
  saveExplorerStatus,
} from "ee/pages/Editor/Explorer/helpers";
import { AddEntity, EmptyComponent } from "../common";
import { noop } from "lodash";
import { Icon } from "@appsmith/ads";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasManagePagePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";

interface ExplorerWidgetGroupProps {
  step: number;
  searchKeyword?: string;
  addWidgetsFn?: () => void;
}

export const ExplorerWidgetGroup = memo((props: ExplorerWidgetGroupProps) => {
  const applicationId = useSelector(getCurrentApplicationId);
  const basePageId = useSelector(getCurrentBasePageId) || "";
  const widgets = useSelector(selectWidgetsForCurrentPage);
  let isWidgetsOpen = getExplorerStatus(applicationId, "widgets");

  if (isWidgetsOpen === null || isWidgetsOpen === undefined) {
    isWidgetsOpen = widgets?.children?.length === 0;
    saveExplorerStatus(applicationId, "widgets", isWidgetsOpen);
  }

  const widgetsInStep = useMemo(() => {
    return widgets?.children?.map((child) => child.widgetId) || [];
  }, [widgets?.children]);

  const onWidgetToggle = useCallback(
    (isOpen: boolean) => {
      saveExplorerStatus(applicationId, "widgets", isOpen);
    },
    [applicationId],
  );

  const pagePermissions = useSelector(getPagePermissions);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canManagePages = getHasManagePagePermission(
    isFeatureEnabled,
    pagePermissions,
  );

  return (
    <Entity
      addButtonHelptext={createMessage(ADD_WIDGET_TOOLTIP)}
      canEditEntityName={canManagePages}
      className={`group widgets ${props.addWidgetsFn ? "current" : ""}`}
      disabled={!widgets && !!props.searchKeyword}
      entityId={basePageId + "_widgets"}
      icon={""}
      isDefaultExpanded={isWidgetsOpen}
      isSticky
      key={basePageId + "_widgets"}
      name="Widgets"
      onCreate={props.addWidgetsFn}
      onToggle={onWidgetToggle}
      searchKeyword={props.searchKeyword}
      showAddButton={canManagePages}
      step={props.step}
    >
      {widgets?.children?.map((child) => (
        <WidgetEntity
          basePageId={basePageId}
          childWidgets={child.children}
          key={child.widgetId}
          searchKeyword={props.searchKeyword}
          step={props.step + 1}
          widgetId={child.widgetId}
          widgetName={child.widgetName}
          widgetType={child.type}
          widgetsInStep={widgetsInStep}
        />
      ))}
      {(!widgets?.children || widgets?.children.length === 0) &&
        !props.searchKeyword && (
          <EmptyComponent
            addBtnText={createMessage(EMPTY_WIDGET_BUTTON_TEXT)}
            addFunction={props.addWidgetsFn || noop}
            mainText={createMessage(EMPTY_WIDGET_MAIN_TEXT)}
          />
        )}
      {widgets?.children && widgets?.children?.length > 0 && canManagePages && (
        <AddEntity
          action={props.addWidgetsFn}
          entityId={basePageId + "_widgets_add_new_datasource"}
          icon={<Icon name="plus" />}
          name={createMessage(ADD_WIDGET_BUTTON)}
          step={props.step + 1}
        />
      )}
    </Entity>
  );
});

ExplorerWidgetGroup.displayName = "ExplorerWidgetGroup";
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(ExplorerWidgetGroup as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default ExplorerWidgetGroup;
