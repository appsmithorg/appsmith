import React, { ReactNode, useState } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { Collapse, Icon, Classes } from "@blueprintjs/core";
import { AppState } from "reducers";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { Page } from "constants/ReduxActionConstants";
import { MenuIcons } from "icons/MenuIcons";
import { WidgetIcons } from "icons/WidgetIcons";
import { Colors } from "constants/Colors";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import { WidgetTypes, WidgetType } from "constants/WidgetConstants";

const ENTITY_ICON_SIZE = 14;

const PageIcon = MenuIcons.PAGES_ICON;
const pageIcon = (
  <PageIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.WHITE}
  />
);

const WidgetIcon = MenuIcons.WIDGETS_ICON;
const widgetIcon = (
  <WidgetIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.WHITE}
  />
);

const ApiIcon = MenuIcons.APIS_ICON;
const apiIcon = (
  <ApiIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.WHITE}
  />
);

const QueryIcon = MenuIcons.QUERIES_ICON;
const queryIcon = (
  <QueryIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.WHITE}
  />
);

const getWidgetIcon = (type: WidgetType) => {
  const WidgetIcon = WidgetIcons[type];
  return <WidgetIcon width={ENTITY_ICON_SIZE} height={ENTITY_ICON_SIZE} />;
};

const Wrapper = styled.div`
  padding: ${props => props.theme.spaces[3]}px;
`;
const EntityItem = styled.div`
  height: 30px;
  font-size: ${props => props.theme.fontSizes[3]}px;
  line-height: ${props => props.theme.lineHeights[2]}px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: ${props => props.theme.spaces[3]}px;
  border-radius: 2px;
  &:hover {
    background: ${Colors.MAKO};
  }
  & {
    .${Classes.ICON} {
      margin-right: ${props => props.theme.spaces[2]}px;
    }
  }
  cursor: pointer;
  & > div {
    margin-right: ${props => props.theme.spaces[3]}px;
  }
`;
const StyledCollapse = styled(Collapse)<{ step: number }>`
  & {
    .${Classes.COLLAPSE_BODY} {
      margin-left: ${props => props.theme.spaces[4] * props.step}px;
    }
  }
`;

const useEntities = () => {
  const canvasWidgets = useSelector((state: AppState) => {
    return state.entities.canvasWidgets;
  });

  const currentPageId = useSelector((state: AppState) => {
    return state.entities.pageList.currentPageId;
  });

  const widgetTree = CanvasWidgetsNormalizer.denormalize("0", {
    canvasWidgets,
  });

  widgetTree.ENTITY_TYPE = ENTITY_TYPE.WIDGET;
  widgetTree.pageId = currentPageId;

  const actions = useSelector((state: AppState) => {
    return state.entities.actions.map(action => ({
      ...action,
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
    }));
  });

  const pages: Array<Page & { ENTITY_TYPE: ENTITY_TYPE }> = useSelector(
    (state: AppState) =>
      state.entities.pageList.pages.map(page => {
        return { ...page, ENTITY_TYPE: ENTITY_TYPE.PAGE };
      }),
  );
  return { widgetTree, actions, pages, currentPageId };
};
const Entity = (props: {
  name: string;
  children?: ReactNode;
  icon: ReactNode;
  step: number;
  disabled: boolean;
}) => {
  const [isOpen, open] = useState(false);
  const toggleChildren = () => {
    !props.disabled && open(!isOpen);
  };
  const collapseIcon = isOpen ? (
    <Icon icon="chevron-down" />
  ) : (
    <Icon icon="chevron-right" />
  );
  return (
    <React.Fragment>
      <EntityItem onClick={toggleChildren}>
        {props.children && collapseIcon}
        {props.icon} {props.name}
      </EntityItem>
      {props.children && (
        <StyledCollapse step={props.step + 1} isOpen={isOpen}>
          {props.children}
        </StyledCollapse>
      )}
    </React.Fragment>
  );
};

const getEntityListItem = (entity: any, step: number) => {
  switch (entity.ENTITY_TYPE) {
    case ENTITY_TYPE.WIDGET:
      if (entity.type === WidgetTypes.CANVAS_WIDGET) {
        return (
          entity.children &&
          entity.children.length > 0 &&
          entity.children.map((child: any) =>
            getEntityListItem(
              { ...child, ENTITY_TYPE: ENTITY_TYPE.WIDGET },
              step,
            ),
          )
        );
      }
      // TODO(abhinav): Let it pass when the Icon widget is available.
      if (entity.type === WidgetTypes.ICON_WIDGET) {
        return null;
      }
      return (
        <Entity
          key={entity.widgetId}
          icon={getWidgetIcon(entity.type)}
          name={entity.widgetName}
          step={step}
          disabled={false}
        >
          {entity.children &&
            entity.children.length > 0 &&
            entity.children.map((child: any) =>
              getEntityListItem(
                { ...child, ENTITY_TYPE: ENTITY_TYPE.WIDGET },
                step,
              ),
            )}
        </Entity>
      );
    case ENTITY_TYPE.ACTION:
      if (entity.config.pluginType === "API") {
        return (
          <Entity
            key={entity.config.id}
            icon={apiIcon}
            name={entity.config.name}
            step={step}
            disabled={false}
          />
        );
      } else if (entity.config.pluginType === "DB") {
        return (
          <Entity
            key={entity.config.id}
            icon={queryIcon}
            name={entity.config.name}
            step={step}
            disabled={false}
          />
        );
      }
      break;
  }
};

const getPageEntityGroups = (
  page: { name: string; id: string },
  entityGroups: Array<{ type: ENTITY_TYPE; entries: any }>,
  isCurrentPage: boolean,
) => {
  const groups = entityGroups.map(group => {
    switch (group.type) {
      case ENTITY_TYPE.ACTION:
        return [
          <Entity
            key={page.id + "_api"}
            icon={apiIcon}
            name="APIs"
            step={1}
            disabled={group.entries.length === 0}
          >
            {group.entries
              .filter((entry: any) => entry.config.pluginType === "API")
              .map((api: any) => getEntityListItem(api, 2))}
          </Entity>,
          <Entity
            key={page.id + "_query"}
            icon={queryIcon}
            name="Queries"
            step={1}
            disabled={group.entries.length === 0}
          >
            {group.entries
              .filter((entry: any) => entry.config.pluginType === "DB")
              .map((query: any) => getEntityListItem(query, 2))}
          </Entity>,
        ];
      case ENTITY_TYPE.WIDGET:
        return (
          <Entity
            key={page.id + "_widgetId"}
            icon={widgetIcon}
            name="Widgets"
            step={1}
            disabled={false}
          >
            {getEntityListItem(group.entries, 2)}
          </Entity>
        );
      default:
        return null;
    }
  });
  return (
    <Entity
      key={page.id}
      icon={pageIcon}
      name={page.name}
      step={0}
      disabled={!isCurrentPage}
    >
      {groups}
    </Entity>
  );
};

const EntityExplorer = () => {
  const { pages, widgetTree, actions, currentPageId } = useEntities();
  return (
    <Wrapper>
      {pages.map(page =>
        getPageEntityGroups(
          { id: page.pageId, name: page.pageName },
          [
            {
              type: ENTITY_TYPE.ACTION,
              entries: actions.filter(
                action => action.config.pageId === page.pageId,
              ),
            },
            {
              type: ENTITY_TYPE.WIDGET,
              entries: widgetTree.pageId === page.pageId ? widgetTree : [],
            },
          ],
          page.pageId === currentPageId,
        ),
      )}
    </Wrapper>
  );
};

export default EntityExplorer;
