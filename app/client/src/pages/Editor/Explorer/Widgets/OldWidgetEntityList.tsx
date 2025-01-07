import React, { useMemo } from "react";
import styled from "styled-components";
import { Flex } from "@appsmith/ads";
import { useSelector } from "react-redux";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { selectWidgetsForCurrentPage } from "ee/selectors/entitiesSelector";
import WidgetEntity from "./WidgetEntity";

const ListContainer = styled(Flex)`
  & .t--entity-item {
    height: 32px;
  }
`;

export const OldWidgetEntityList = () => {
  const basePageId = useSelector(getCurrentBasePageId) as string;
  const widgets = useSelector(selectWidgetsForCurrentPage);
  const widgetsInStep = useMemo(() => {
    return widgets?.children?.map((child) => child.widgetId) || [];
  }, [widgets?.children]);

  if (!widgets) return null;

  if (!widgets.children) return null;

  return (
    <ListContainer>
      {widgets.children.map((child) => (
        <WidgetEntity
          basePageId={basePageId}
          childWidgets={child.children}
          key={child.widgetId}
          searchKeyword=""
          step={1}
          widgetId={child.widgetId}
          widgetName={child.widgetName}
          widgetType={child.type}
          widgetsInStep={widgetsInStep}
        />
      ))}
    </ListContainer>
  );
};
