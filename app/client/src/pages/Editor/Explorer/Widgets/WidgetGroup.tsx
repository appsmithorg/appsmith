import React, { memo, useMemo } from "react";
import { useSelector } from "react-redux";
import EntityPlaceholder from "../Entity/Placeholder";
import Entity from "../Entity";
import WidgetEntity from "./WidgetEntity";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import { BUILDER_PAGE_URL } from "constants/routes";
import { Link } from "react-router-dom";
import styled from "styled-components";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { ADD_WIDGET_TOOLTIP, createMessage } from "constants/messages";
import { getWidgetsForCurrentPage } from "selectors/entitiesSelector";

type ExplorerWidgetGroupProps = {
  step: number;
  searchKeyword?: string;
  addWidgetsFn?: () => void;
};

const StyledLink = styled(Link)`
  & {
    color: ${(props) => props.theme.colors.primary};
    &:hover {
      color: ${(props) => props.theme.colors.primary};
    }
  }
`;

export const ExplorerWidgetGroup = memo((props: ExplorerWidgetGroupProps) => {
  const params = useParams<ExplorerURLParams>();
  const pageId = useSelector(getCurrentPageId) || "";
  const widgets = useSelector(getWidgetsForCurrentPage);
  const applicationId = useSelector(getCurrentApplicationId);

  const childNode = (
    <EntityPlaceholder step={props.step}>
      {params.pageId !== pageId ? (
        <>
          <StyledLink
            to={BUILDER_PAGE_URL({
              applicationId,
              pageId: pageId,
            })}
          >
            switch to this page
          </StyledLink>
          ,&nbsp;then&nbsp;
        </>
      ) : (
        "  "
      )}
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
      isDefaultExpanded={widgets?.children?.length === 0}
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
