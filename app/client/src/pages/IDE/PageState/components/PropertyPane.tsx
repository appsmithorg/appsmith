import React, { useCallback } from "react";
import PagePaneContainer from "./PagePaneContainer";
import history from "utils/history";
import { pageEntityUrl } from "../../../../RouteBuilder";
import { useDispatch, useSelector } from "react-redux";
import { getWidgets } from "../../../../sagas/selectors";
import type { Item } from "../../components/ListView";
import { getSelectedWidgets } from "../../../../selectors/ui";
import { selectWidgetInitAction } from "../../../../actions/widgetSelectionActions";
import { SelectionRequestType } from "../../../../sagas/WidgetSelectUtils";
import { MAIN_CONTAINER_WIDGET_ID } from "../../../../constants/WidgetConstants";
import PropertyPaneContainer from "../../../Editor/WidgetsEditor/PropertyPaneWrapper";
import type { RouteComponentProps } from "react-router";
import { PageNavState } from "../../ideReducer";

const PropertyPaneSidebar = (
  props: RouteComponentProps<{ pageId: string; widgetIds: string }>,
) => {
  const dispatch = useDispatch();
  const pageId = props.match.params.pageId;
  const selectedWidgetIds = useSelector(getSelectedWidgets);
  const addItemClick = useCallback(() => {
    history.push(pageEntityUrl({ pageId }, PageNavState.UI));
  }, []);
  const widgets = useSelector(getWidgets);
  const toListWidgets: Array<Item> = Object.values(widgets)
    .filter((w) => w.widgetId !== MAIN_CONTAINER_WIDGET_ID)
    .sort((a, b) => {
      if (selectedWidgetIds.indexOf(a.widgetId) === 0) {
        return -1;
      } else if (selectedWidgetIds.indexOf(b.widgetId) === 0) {
        return 1;
      }
      return 0;
    })
    .map((widget) => ({
      name: widget.widgetName,
      key: widget.widgetId,
      selected: selectedWidgetIds.includes(widget.widgetId),
    }));
  const listItemClick = useCallback((item) => {
    dispatch(selectWidgetInitAction(SelectionRequestType.One, [item.key]));
  }, []);
  return (
    <PagePaneContainer
      editor={<PropertyPaneContainer />}
      listItems={toListWidgets}
      listStateTitle={`Widgets on this page (${toListWidgets.length})`}
      onAddClick={addItemClick}
      onListClick={listItemClick}
      titleItemCounts={1}
    />
  );
};

export default PropertyPaneSidebar;
