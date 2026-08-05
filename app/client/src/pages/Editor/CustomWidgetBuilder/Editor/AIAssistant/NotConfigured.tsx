import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Button, Icon, Text } from "@appsmith/ads";
import { getCurrentUser } from "selectors/usersSelectors";
import {
  createMessage,
  CUSTOM_WIDGET_AI_ASSISTANT,
} from "ee/constants/messages";

const ADMIN_SETTINGS_AI_PATH = "/settings/ai";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  padding: 32px;
  text-align: center;

  .sparkle-icon {
    color: var(--ads-v2-color-fg-brand);
  }
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 420px;
`;

interface NotConfiguredProps {
  /**
   * When true, superusers get a shortcut to the AI assistant admin settings
   * page. Only enable where that settings page exists (EE).
   */
  showSettingsCta?: boolean;
}

export default function NotConfigured(props: NotConfiguredProps) {
  const user = useSelector(getCurrentUser);
  const isSuperUser = Boolean(user?.isSuperUser);
  const showSettingsCta = Boolean(props.showSettingsCta) && isSuperUser;

  const openAISettings = useCallback(() => {
    window.open(ADMIN_SETTINGS_AI_PATH, "_blank");
  }, []);

  return (
    <Wrapper data-testid="t--custom-widget-ai-not-configured">
      <Icon className="sparkle-icon" name="sparkling-filled" size="lg" />
      <Text kind="heading-s">
        {createMessage(CUSTOM_WIDGET_AI_ASSISTANT.NOT_CONFIGURED_TITLE)}
      </Text>
      <Body>
        <Text color="var(--ads-v2-color-fg-muted)" kind="body-m">
          {createMessage(CUSTOM_WIDGET_AI_ASSISTANT.NOT_CONFIGURED_BODY)}
        </Text>
        <Text color="var(--ads-v2-color-fg-muted)" kind="body-m">
          {showSettingsCta
            ? createMessage(
                CUSTOM_WIDGET_AI_ASSISTANT.NOT_CONFIGURED_ADMIN_HINT,
              )
            : createMessage(
                CUSTOM_WIDGET_AI_ASSISTANT.NOT_CONFIGURED_NON_ADMIN_HINT,
              )}
        </Text>
      </Body>
      {showSettingsCta && (
        <Button
          kind="secondary"
          onClick={openAISettings}
          size="md"
          startIcon="settings-2-line"
        >
          {createMessage(CUSTOM_WIDGET_AI_ASSISTANT.OPEN_AI_SETTINGS_CTA)}
        </Button>
      )}
    </Wrapper>
  );
}
