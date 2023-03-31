import React from "react";
import { ConfirmMenuItem, ConfirmRegeneration } from "./StyledComponents";
import {
  createMessage,
  DELETE_CONFIRMATION_MODAL_TITLE,
  REGENERATE_KEY_CONFIRM_MESSAGE,
  YES,
} from "@appsmith/constants/messages";
import { Text, TextType } from "design-system-old";
import { Button } from "design-system";

/**
 * getConfirmMenuItem
 * @param regenerateKey {() => void}
 */
export function getConfirmMenuItem(regenerateKey: () => void) {
  return (
    <ConfirmMenuItem>
      <Text type={TextType.P3}>
        {createMessage(REGENERATE_KEY_CONFIRM_MESSAGE)}
      </Text>
      <ConfirmRegeneration>
        <Text type={TextType.P1}>
          {createMessage(DELETE_CONFIRMATION_MODAL_TITLE)}
        </Text>
        <Button onClick={regenerateKey} size="sm">
          {createMessage(YES)}
        </Button>
      </ConfirmRegeneration>
    </ConfirmMenuItem>
  );
}
