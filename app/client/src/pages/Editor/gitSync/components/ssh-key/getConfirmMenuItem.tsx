import React from "react";
import { ConfirmMenuItem, ConfirmRegeneration } from "./StyledComponents";
import {
  createMessage,
  DELETE_CONFIRMATION_MODAL_TITLE,
  REGENERATE_KEY_CONFIRM_MESSAGE,
  YES,
} from "@appsmith/constants/messages";
import { Button, Category, Size } from "components/ads";
import { Text, TextType } from "design-system";

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
        <Button
          category={Category.primary}
          onClick={regenerateKey}
          size={Size.xs}
          text={createMessage(YES)}
        />
      </ConfirmRegeneration>
    </ConfirmMenuItem>
  );
}
