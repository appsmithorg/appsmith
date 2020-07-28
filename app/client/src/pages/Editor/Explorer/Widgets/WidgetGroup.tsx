import React from "react";
import EntityPlaceholder from "../Entity/Placeholder";
import Entity from "../Entity";
import { widgetIcon } from "../ExplorerIcons";
import WidgetEntity, { WidgetTree } from "./WidgetEntity";
import { WidgetTypes } from "constants/WidgetConstants";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import { BUILDER_PAGE_URL } from "constants/routes";
import { Link } from "react-router-dom";
import styled from "styled-components";

const getWidgetEntity = (
  entity: any,
  step: number,
  pageId: string,
  parentModalId?: string,
  searchKeyword?: string,
) => {
  if (!entity) {
    if (searchKeyword) {
      return <React.Fragment />;
    } else {
      return;
    }
  }
  if (entity.type === WidgetTypes.CANVAS_WIDGET) {
    if (!entity.children || entity.children.length === 0) return;
    return entity.children.map((child: any) =>
      getWidgetEntity(child, step + 1, pageId, parentModalId, searchKeyword),
    );
  }
  const childEntities =
    entity.children &&
    entity.children.length > 0 &&
    entity.children.map((child: any) =>
      getWidgetEntity(
        child,
        step,
        pageId,
        entity.type === WidgetTypes.MODAL_WIDGET ? entity.widgetId : undefined,
        searchKeyword,
      ),
    );

  return (
    <WidgetEntity
      widgetProps={entity}
      step={step}
      key={entity.widgetId}
      parentModalId={parentModalId}
      searchKeyword={searchKeyword}
      pageId={pageId}
    >
      {childEntities}
    </WidgetEntity>
  );
};

type ExplorerWidgetGroupProps = {
  pageId: string;
  step: number;
  widgets: WidgetTree | null;
  searchKeyword?: string;
};

const StyledLink = styled(Link)`
  & {
    color: ${props => props.theme.colors.primary};
    &:hover {
      color: ${props => props.theme.colors.primary};
    }
  }
`;

export const ExplorerWidgetGroup = (props: ExplorerWidgetGroupProps) => {
  const params = useParams<ExplorerURLParams>();
  let childNode = getWidgetEntity(
    props.widgets,
    props.step,
    props.pageId,
    undefined,
    props.searchKeyword,
  );
  if (!childNode && !props.searchKeyword) {
    childNode = (
      <EntityPlaceholder step={props.step + 1}>
        No widgets yet. Please{" "}
        {params.pageId !== props.pageId ? (
          <React.Fragment>
            <StyledLink
              to={BUILDER_PAGE_URL(params.applicationId, props.pageId)}
            >
              switch to this page
            </StyledLink>
            ,&nbsp;then&nbsp;
          </React.Fragment>
        ) : (
          "  "
        )}
        click the <strong>Widgets</strong> navigation menu icon on the left to
        drag and drop widgets
      </EntityPlaceholder>
    );
  }
  return (
    <Entity
      key={props.pageId + "_widgets"}
      icon={widgetIcon}
      step={props.step}
      name="Widgets"
      disabled={!props.widgets && !!props.searchKeyword}
      entityId={props.pageId + "_widgets"}
      isDefaultExpanded={!!props.searchKeyword}
    >
      {childNode}
    </Entity>
  );
};

export default ExplorerWidgetGroup;
