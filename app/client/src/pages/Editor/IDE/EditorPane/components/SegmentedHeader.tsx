import React from "react";
import { Button, Flex, Icon, SegmentedControl } from "design-system";
import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import { EditorEntityTab } from "@appsmith/entities/IDE/constants";
import history from "utils/history";
import { globalAddURL } from "@appsmith/RouteBuilder";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import { useCurrentEditorState, useSegmentNavigation } from "../../hooks";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import QuerySVG from "assets/icons/ads/query.svg";

const Container = styled(Flex)`
  #editor-pane-segment-control {
    max-width: 280px;
  }

  button {
    flex-shrink: 0;
    flex-basis: auto;
  }
`;

const Label = styled(Flex)`
  font-weight: 500;
  align-items: center;
  gap: 5px;

  .ads-tag {
    border: 1px solid var(--ads-v2-color-border);
  }
`;

const SegmentedHeader = () => {
  const isGlobalAddPaneEnabled = useFeatureFlag(
    FEATURE_FLAG.release_global_add_pane_enabled,
  );
  const pageId = useSelector(getCurrentPageId);
  const onAddButtonClick = () => {
    history.push(globalAddURL({ pageId }));
  };
  const { segment } = useCurrentEditorState();
  const { onSegmentChange } = useSegmentNavigation();

  return (
    <Container
      alignItems="center"
      backgroundColor="var(--ads-v2-colors-control-track-default-bg)"
      className="ide-editor-left-pane__header"
      gap="spaces-2"
      justifyContent="space-between"
      padding="spaces-2"
    >
      <SegmentedControl
        id="editor-pane-segment-control"
        onChange={onSegmentChange}
        options={[
          {
            label: (
              <Label>
                <img src={QuerySVG} />
                {createMessage(EDITOR_PANE_TEXTS.queries_tab)}
              </Label>
            ),
            value: EditorEntityTab.QUERIES,
          },
          {
            label: (
              <Label>
                <Icon name="binding-new" size="md" />
                {createMessage(EDITOR_PANE_TEXTS.js_tab)}
              </Label>
            ),
            value: EditorEntityTab.JS,
          },
          {
            label: (
              <Label>
                <Icon name="dashboard-line" />
                {createMessage(EDITOR_PANE_TEXTS.ui_tab)}
              </Label>
            ),
            value: EditorEntityTab.UI,
          },
        ]}
        value={segment}
      />
      {isGlobalAddPaneEnabled ? (
        <Button
          className={"t--add-editor-button"}
          isIconButton
          kind="primary"
          onClick={onAddButtonClick}
          size="sm"
          startIcon="add-line"
        />
      ) : null}
    </Container>
  );
};

export default SegmentedHeader;
