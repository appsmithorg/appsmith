import React, { ReactNode, useState } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { Collapse } from "@blueprintjs/core";
import { AppState } from "reducers";
import { RestAction } from "api/ActionAPI";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { Page } from "constants/ReduxActionConstants";
import { MenuIcons } from "icons/MenuIcons";
import { Colors } from "constants/Colors";

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

const Wrapper = styled.div``;
const EntityItem = styled.div`
  height: 30px;
  font-size: ${props => props.theme.fontSizes[3]}px;
`;

const useEntities = () => {
  const widgets = useSelector((state: AppState) => {
    return Object.values(state.entities.canvasWidgets).map(widget => ({
      ...widget,
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    }));
  });

  const actions = useSelector((state: AppState) => {
    return state.entities.actions;
  });

  const apis = actions
    .filter(action => action.config.pluginType === "API")
    .map(action => ({ ...action, ENTITY_TYPE: ENTITY_TYPE.ACTION }));

  const queries = actions
    .filter(action => action.config.pluginType === "DB")
    .map(action => ({ ...action, ENTITY_TYPE: ENTITY_TYPE.ACTION }));

  const pages: Array<Page & { ENTITY_TYPE: ENTITY_TYPE }> = useSelector(
    (state: AppState) =>
      state.entities.pageList.pages.map(page => {
        return { ...page, ENTITY_TYPE: ENTITY_TYPE.PAGE };
      }),
  );
  return { widgets, apis, queries, pages };
};
const Entity = (props: {
  name: string;
  children?: ReactNode;
  icon: ReactNode;
}) => {
  const [isOpen, open] = useState(false);
  const toggleChildren = () => {
    open(!isOpen);
  };
  return (
    <React.Fragment>
      <EntityItem onClick={toggleChildren}>
        {props.icon} {props.name}
      </EntityItem>
      <Collapse isOpen>{props.children}</Collapse>
    </React.Fragment>
  );
};

const getEntityListItem = (entity: any, childEntities?: any) => {
  switch (entity.ENTITY_TYPE) {
    case ENTITY_TYPE.WIDGET:
      return (
        <Entity
          key={entity.widgetId}
          icon={widgetIcon}
          name={entity.widgetName}
        />
      );
    case ENTITY_TYPE.ACTION:
      if (entity.config.pluginType === "API") {
        return (
          <Entity
            key={entity.config.id}
            icon={apiIcon}
            name={entity.config.name}
          />
        );
      } else if (entity.config.pluginType === "DB") {
        return (
          <Entity
            key={entity.config.id}
            icon={queryIcon}
            name={entity.config.name}
          />
        );
      }
    case ENTITY_TYPE.PAGE:
      return (
        <Entity key={entity.pageId} icon={pageIcon} name={entity.pageName}>
          {childEntities.map((child: any) => getEntityListItem(child))}
        </Entity>
      );
  }
};

const EntityExplorer = () => {
  const { pages, widgets, apis, queries } = useEntities();
  return (
    <Wrapper>
      {pages.map(page =>
        getEntityListItem(page, [
          ...apis.filter(api => api.config.pageId === page.pageId),
          ...queries.filter(query => query.config.pageId === page.pageId),
          ...widgets,
        ]),
      )}
    </Wrapper>
  );
};

export default EntityExplorer;
