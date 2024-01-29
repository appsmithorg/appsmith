import { Button, Flex } from "design-system";
import React from "react";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";

const MutedText = styled.span`
  opacity: 70%;
`;

interface Props {
  onSettingsClick: () => void;
  onRunClick: () => void;
}

const ActionToolbar = (props: Props) => {
  const isSideBySideEnabled = useFeatureFlag(
    FEATURE_FLAG.release_side_by_side_ide_enabled,
  );
  if (!isSideBySideEnabled) return null;
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
        <Button
          isIconButton
          kind="tertiary"
          size="sm"
          startIcon="more-2-fill"
        />
      </Flex>
      <Flex>
        <Button kind="primary" onClick={props.onRunClick} size="sm">
          Run
          <MutedText>&nbsp;⌘⏎</MutedText>
        </Button>
      </Flex>
    </Flex>
  );
};

export default ActionToolbar;
