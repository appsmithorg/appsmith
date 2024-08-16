import { Button, Flex, Tooltip } from "@appsmith/ads";
import React from "react";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { createMessage, DOCUMENTATION_TOOLTIP } from "ee/constants/messages";

const MutedText = styled.span`
  opacity: 70%;
`;

interface Props {
  onSettingsClick: () => void;
  onRunClick: () => void;
  runOptionSelector?: React.ReactNode;
  onDocsClick?: () => void;
}

const ActionToolbar = (props: Props) => {
  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );
  if (!isActionRedesignEnabled) return null;
  return (
    <Flex
      alignItems="center"
      borderTop="1px solid var(--ads-v2-color-border);"
      flexDirection="row"
      height="32px"
      justifyContent="space-between"
      padding="spaces-2"
    >
      <Flex flexDirection="row" gap="spaces-3">
        <Button
          isIconButton
          kind="secondary"
          onClick={props.onSettingsClick}
          size="sm"
          startIcon="settings-2-line"
        />
        {props.onDocsClick ? (
          <Tooltip
            content={createMessage(DOCUMENTATION_TOOLTIP)}
            placement="top"
          >
            <Button
              isIconButton
              kind="tertiary"
              onClick={props.onDocsClick}
              size="sm"
              startIcon="book-line"
            />
          </Tooltip>
        ) : null}
        <Button
          isIconButton
          kind="tertiary"
          size="sm"
          startIcon="more-2-fill"
        />
      </Flex>
      <Flex alignItems="center" gap="spaces-3">
        {props.runOptionSelector}
        <Button kind="primary" onClick={props.onRunClick} size="sm">
          Run
          <MutedText>&nbsp;⌘⏎</MutedText>
        </Button>
      </Flex>
    </Flex>
  );
};

export default ActionToolbar;
