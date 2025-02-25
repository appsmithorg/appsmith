import React, { useCallback } from "react";
import { Button, Flex, Text } from "@appsmith/ads";
import { useSelector } from "react-redux";
import styled from "styled-components";

import history from "utils/history";
import UIEntitySidebar from "../../Editor/widgetSidebar/UIEntitySidebar";
import { widgetListURL } from "ee/RouteBuilder";
import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";
import { getCurrentBasePageId } from "selectors/editorSelectors";

const Container = styled(Flex)`
  padding-right: var(--ads-v2-spaces-2);
  background-color: var(--ads-v2-color-gray-50);
`;

const AddWidgets = (props: { focusSearchInput?: boolean }) => {
  const basePageId = useSelector(getCurrentBasePageId) as string;

  const closeButtonClickHandler = useCallback(() => {
    history.push(widgetListURL({ basePageId }));
  }, [basePageId]);

  return (
    <>
      <Container
        alignItems="center"
        borderBottom={"1px solid var(--ads-v2-color-border)"}
        data-testid="t--ide-add-pane"
        justifyContent="space-between"
        px="spaces-4"
        py="spaces-2"
      >
        <Text color="var(--ads-v2-color-fg)" kind="heading-xs">
          {createMessage(EDITOR_PANE_TEXTS.widgets_create_tab_title)}
        </Text>
        <Button
          aria-label="Close pane"
          data-testid="t--add-pane-close-icon"
          isIconButton
          kind={"tertiary"}
          onClick={closeButtonClickHandler}
          size={"sm"}
          startIcon={"close-line"}
        />
      </Container>
      <Flex flexDirection="column" gap="spaces-3" overflowX="auto">
        <UIEntitySidebar focusSearchInput={props.focusSearchInput} isActive />
      </Flex>
    </>
  );
};

export default AddWidgets;
