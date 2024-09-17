import React from "react";
import { useDispatch } from "react-redux";

import { closeAppThemingBetaCard } from "actions/appThemingActions";
import {
  createMessage,
  APP_THEME_BETA_CARD_HEADING,
  APP_THEME_BETA_CARD_CONTENT,
} from "ee/constants/messages";
import { Button } from "@appsmith/ads";

export function ThemeBetaCard() {
  const dispatch = useDispatch();

  const closeThemeBetaCard = () => {
    dispatch(closeAppThemingBetaCard());
  };

  return (
    <div className="space-y-2">
      <b>{createMessage(APP_THEME_BETA_CARD_HEADING)}</b>
      <div>{createMessage(APP_THEME_BETA_CARD_CONTENT)}</div>
      <div className="flex items-center space-x-2">
        <Button kind="secondary">Learn more</Button>
        <Button onClick={closeThemeBetaCard}>Got it</Button>
      </div>
    </div>
  );
}
