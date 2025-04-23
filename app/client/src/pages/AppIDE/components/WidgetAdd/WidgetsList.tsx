import React from "react";

import { useUIExplorerItems } from "pages/Editor/widgetSidebar/hooks";
import UIEntitySidebar from "pages/Editor/widgetSidebar/UIEntitySidebar";

interface WidgetsListProps {
  focusSearchInput?: boolean;
}

function WidgetsList({ focusSearchInput }: WidgetsListProps) {
  const { cards, entityLoading, groupedCards } = useUIExplorerItems();

  return (
    <UIEntitySidebar
      cards={cards}
      entityLoading={entityLoading}
      focusSearchInput={focusSearchInput}
      groupedCards={groupedCards}
      isActive
    />
  );
}

export default WidgetsList;
