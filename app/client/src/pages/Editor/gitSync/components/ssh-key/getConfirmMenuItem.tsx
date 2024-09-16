import React from "react";
import {
  ConfirmRegeneration,
  ConfirmRegenerationActions,
} from "./StyledComponents";
import {
  createMessage,
  DELETE_CONFIRMATION_MODAL_TITLE,
  REGENERATE_KEY_CONFIRM_MESSAGE,
  YES,
} from "ee/constants/messages";
import { Button, MenuItem, Text } from "@appsmith/ads";

/**
 * getConfirmMenuItem
 * @param regenerateKey {() => void}
 * @param cancel
 */
export function getConfirmMenuItem(regenerateKey: () => void) {
  return (
    <MenuItem className="menuitem-nohover">
      <Text kind="body-s">{createMessage(REGENERATE_KEY_CONFIRM_MESSAGE)}</Text>
      <ConfirmRegeneration>
        <Text kind="body-m">
          {createMessage(DELETE_CONFIRMATION_MODAL_TITLE)}
        </Text>
        <ConfirmRegenerationActions>
          <Button onClick={regenerateKey} size="sm">
            {createMessage(YES)}
          </Button>
        </ConfirmRegenerationActions>
      </ConfirmRegeneration>
    </MenuItem>
  );
}
