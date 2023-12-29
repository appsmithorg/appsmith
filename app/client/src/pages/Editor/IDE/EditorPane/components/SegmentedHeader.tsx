import React from "react";
import { Button, Flex, SegmentedControl } from "design-system";
import { createMessage, PAGES_PANE_TEXTS } from "@appsmith/constants/messages";
import { EditorEntityTab } from "entities/IDE/constants";
import history, { NavigationMethod } from "utils/history";
import {
  globalAddURL,
  jsCollectionListURL,
  queryListURL,
  widgetListURL,
} from "@appsmith/RouteBuilder";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import { useCurrentEditorState } from "../../hooks";
import styled from "styled-components";

const Container = styled(Flex)`
  button {
    flex-shrink: 0;
    flex-basis: auto;
  }
`;

const SegmentedHeader = () => {
  const pageId = useSelector(getCurrentPageId);
  const onAddButtonClick = () => {
    history.push(globalAddURL({ pageId }));
  };
  const { segment } = useCurrentEditorState();
  /**
   * Callback to handle the segment change
   *
   * @param value
   * @returns
   *
   */
  const onSegmentChange = (value: string) => {
    switch (value) {
      case EditorEntityTab.QUERIES:
        history.push(queryListURL({ pageId }), {
          invokedBy: NavigationMethod.SegmentControl,
        });
        break;
      case EditorEntityTab.JS:
        history.push(jsCollectionListURL({ pageId }), {
          invokedBy: NavigationMethod.SegmentControl,
        });
        break;
      case EditorEntityTab.UI:
        history.push(widgetListURL({ pageId }), {
          invokedBy: NavigationMethod.SegmentControl,
        });
        break;
    }
  };
  return (
    <Container
      alignItems="center"
      backgroundColor="var(--ads-v2-colors-control-track-default-bg)"
      className="ide-pages-pane__header"
      gap="spaces-2"
      padding="spaces-2"
    >
      <SegmentedControl
        onChange={onSegmentChange}
        options={[
          {
            label: createMessage(PAGES_PANE_TEXTS.queries_tab),
            value: EditorEntityTab.QUERIES,
          },
          {
            label: createMessage(PAGES_PANE_TEXTS.js_tab),
            value: EditorEntityTab.JS,
          },
          {
            label: createMessage(PAGES_PANE_TEXTS.ui_tab),
            value: EditorEntityTab.UI,
          },
        ]}
        value={segment}
      />
      <Button
        className={"t--add-editor-button"}
        isIconButton
        kind="primary"
        onClick={onAddButtonClick}
        size="sm"
        startIcon="add-line"
      />
    </Container>
  );
};

export default SegmentedHeader;
