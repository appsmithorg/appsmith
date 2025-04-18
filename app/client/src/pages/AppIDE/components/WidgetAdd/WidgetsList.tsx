import React from "react";

import { useUIExplorerItems } from "pages/Editor/widgetSidebar/hooks";
import UIEntitySidebar from "pages/Editor/widgetSidebar/UIEntitySidebar";
import {
  createMessage,
  UI_ELEMENT_PANEL_SEARCH_TEXT,
} from "ee/constants/messages";

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
      searchPlaceholderText={createMessage(UI_ELEMENT_PANEL_SEARCH_TEXT)}
    />
  );
}

export default WidgetsList;
