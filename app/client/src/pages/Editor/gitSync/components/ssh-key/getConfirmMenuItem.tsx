import React from "react";
import { ConfirmRegeneration } from "./StyledComponents";
import {
  createMessage,
  DELETE_CONFIRMATION_MODAL_TITLE,
  REGENERATE_KEY_CONFIRM_MESSAGE,
  YES,
  CANCEL_DIALOG,
} from "@appsmith/constants/messages";
import { Text, TextType } from "design-system-old";
import { Button, MenuItem } from "design-system";

/**
 * getConfirmMenuItem
 * @param regenerateKey {() => void}
 * @param cancel
 */
export function getConfirmMenuItem(
  regenerateKey: () => void,
  cancel: () => void,
) {
  return (
    <MenuItem>
      <Text type={TextType.P3}>
        {createMessage(REGENERATE_KEY_CONFIRM_MESSAGE)}
      </Text>
      <ConfirmRegeneration>
        <Text type={TextType.P1}>
          {createMessage(DELETE_CONFIRMATION_MODAL_TITLE)}
        </Text>
        <Button kind="tertiary" onClick={cancel} size="sm">
          {createMessage(CANCEL_DIALOG)}
        </Button>
        <Button onClick={regenerateKey} size="sm">
          {createMessage(YES)}
        </Button>
      </ConfirmRegeneration>
    </MenuItem>
  );
}
