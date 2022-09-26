import React, { memo, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import Entity from "../Entity";
import WidgetEntity from "./WidgetEntity";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  ADD_WIDGET_BUTTON,
  ADD_WIDGET_TOOLTIP,
  createMessage,
  EMPTY_WIDGET_BUTTON_TEXT,
  EMPTY_WIDGET_MAIN_TEXT,
} from "@appsmith/constants/messages";
import { selectWidgetsForCurrentPage } from "selectors/entitiesSelector";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { getExplorerStatus, saveExplorerStatus } from "../helpers";
import { Icon } from "design-system";
import { AddEntity, EmptyComponent } from "../common";
import { noop } from "lodash";

type ExplorerWidgetGroupProps = {
  step: number;
  searchKeyword?: string;
  addWidgetsFn?: () => void;
};

export const ExplorerWidgetGroup = memo((props: ExplorerWidgetGroupProps) => {
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId) || "";
  const widgets = useSelector(selectWidgetsForCurrentPage);
  const guidedTour = useSelector(inGuidedTour);
  let isWidgetsOpen = getExplorerStatus(applicationId, "widgets");
  if (isWidgetsOpen === null) {
    isWidgetsOpen = widgets?.children?.length === 0 || guidedTour;
    saveExplorerStatus(applicationId, "widgets", isWidgetsOpen);
  } else if (guidedTour) {
    isWidgetsOpen = guidedTour;
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

  return (
    <Entity
      addButtonHelptext={createMessage(ADD_WIDGET_TOOLTIP)}
      className={`group widgets ${props.addWidgetsFn ? "current" : ""}`}
      disabled={!widgets && !!props.searchKeyword}
      entityId={pageId + "_widgets"}
      icon={""}
      isDefaultExpanded={isWidgetsOpen}
      isSticky
      key={pageId + "_widgets"}
      name="Widgets"
      onCreate={props.addWidgetsFn}
      onToggle={onWidgetToggle}
      searchKeyword={props.searchKeyword}
      step={props.step}
    >
      {widgets?.children?.map((child) => (
        <WidgetEntity
          childWidgets={child.children}
          key={child.widgetId}
          pageId={pageId}
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
      {widgets?.children && widgets?.children?.length > 0 && (
        <AddEntity
          action={props.addWidgetsFn}
          entityId={pageId + "_widgets_add_new_datasource"}
          icon={<Icon name="plus" />}
          name={createMessage(ADD_WIDGET_BUTTON)}
          step={props.step + 1}
        />
      )}
    </Entity>
  );
});

ExplorerWidgetGroup.displayName = "ExplorerWidgetGroup";
(ExplorerWidgetGroup as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default ExplorerWidgetGroup;
