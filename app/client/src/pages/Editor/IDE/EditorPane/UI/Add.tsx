import React, { useCallback } from "react";
import { Flex } from "design-system";
import { useSelector } from "react-redux";

import history from "utils/history";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import UIEntitySidebar from "pages/Editor/widgetSidebar/UIEntitySidebar";
import { widgetListURL } from "@appsmith/RouteBuilder";
import { EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import SegmentAddHeader from "../components/SegmentAddHeader";

const AddWidgets = (props: { focusSearchInput?: boolean }) => {
  const pageId = useSelector(getCurrentPageId) as string;

  const closeButtonClickHandler = useCallback(() => {
    history.push(widgetListURL({ pageId }));
  }, [pageId]);

  return (
    <>
      <SegmentAddHeader
        onCloseClick={closeButtonClickHandler}
        titleMessage={EDITOR_PANE_TEXTS.widgets_create_tab_title}
      />
      <Flex flexDirection="column" gap="spaces-3" overflowX="scroll">
        <UIEntitySidebar focusSearchInput={props.focusSearchInput} isActive />
      </Flex>
    </>
  );
};

export default AddWidgets;
