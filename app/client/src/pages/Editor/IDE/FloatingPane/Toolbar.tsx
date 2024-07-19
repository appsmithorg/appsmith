import React, { useCallback } from "react";
import { Button, Flex } from "design-system";
import PropertySelector from "./PropertySelector";
import { useDispatch, useSelector } from "react-redux";
import { updateFloatingPane } from "./actions";
import history from "utils/history";
import { widgetURL } from "@appsmith/RouteBuilder";
import { getFloatingPaneSelectedWidget } from "./selectors";

const Toolbar = () => {
  const dispatch = useDispatch();
  const widget = useSelector(getFloatingPaneSelectedWidget);
  const handleClose = useCallback(() => {
    dispatch(updateFloatingPane({ isVisible: false, selectedWidgetId: "0" }));
  }, [dispatch]);

  const selectWidget = useCallback(() => {
    handleClose();
    history.push(widgetURL({ selectedWidgets: [widget.widgetId] }));
  }, [handleClose, widget.widgetId]);
  return (
    <Flex
      alignItems="center"
      direction="column"
      justifyContent="space-between"
      width={"256px"}
    >
      <PropertySelector />
      <Flex gap="spaces-2">
        <Button
          className="rotate-180"
          isIconButton
          kind="tertiary"
          onClick={selectWidget}
          size="sm"
          startIcon="layout-left-2-line"
        />
        <Button
          isIconButton
          kind="tertiary"
          onClick={handleClose}
          size="sm"
          startIcon="close-line"
        />
      </Flex>
    </Flex>
  );
};

export default Toolbar;
