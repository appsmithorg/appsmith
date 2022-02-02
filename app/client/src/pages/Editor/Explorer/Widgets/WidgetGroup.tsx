import React, { memo, useMemo } from "react";
import { useSelector } from "react-redux";
import EntityPlaceholder from "../Entity/Placeholder";
import Entity from "../Entity";
import WidgetEntity from "./WidgetEntity";
import { getCurrentPageId } from "selectors/editorSelectors";
import {
  ADD_WIDGET_TOOLTIP,
  createMessage,
} from "@appsmith/constants/messages";
import { selectWidgetsForCurrentPage } from "selectors/entitiesSelector";
import { inGuidedTour } from "selectors/onboardingSelectors";

type ExplorerWidgetGroupProps = {
  step: number;
  searchKeyword?: string;
  addWidgetsFn?: () => void;
};

export const ExplorerWidgetGroup = memo((props: ExplorerWidgetGroupProps) => {
  const pageId = useSelector(getCurrentPageId) || "";
  const widgets = useSelector(selectWidgetsForCurrentPage);
  const guidedTour = useSelector(inGuidedTour);

  const childNode = (
    <EntityPlaceholder step={props.step}>
      Click the <strong>+</strong> icon above to add widgets
    </EntityPlaceholder>
  );

  const widgetsInStep = useMemo(() => {
    return widgets?.children?.map((child) => child.widgetId) || [];
  }, [widgets?.children]);

  return (
    <Entity
      addButtonHelptext={createMessage(ADD_WIDGET_TOOLTIP)}
      className={`group widgets ${props.addWidgetsFn ? "current" : ""}`}
      disabled={!widgets && !!props.searchKeyword}
      entityId={pageId + "_widgets"}
      icon={""}
      isDefaultExpanded={widgets?.children?.length === 0 || guidedTour}
      isSticky
      key={pageId + "_widgets"}
      name="WIDGETS"
      onCreate={props.addWidgetsFn}
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
        !props.searchKeyword &&
        childNode}
    </Entity>
  );
});

ExplorerWidgetGroup.displayName = "ExplorerWidgetGroup";
(ExplorerWidgetGroup as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default ExplorerWidgetGroup;
