import React from "react";
import styled from "styled-components";
import { useDispatch } from "react-redux";

import { closeAppThemingBetaCard } from "actions/appThemingActions";
import {
  createMessage,
  APP_THEME_BETA_CARD_HEADING,
  APP_THEME_BETA_CARD_CONTENT,
} from "@appsmith/constants/messages";
import { Button, Size, Category, Variant } from "design-system";
import { Colors } from "constants/Colors";

const StyledButton = styled(Button)`
  background-color: ${Colors.BLACK};
  color: ${Colors.WHITE};
  border: 2px solid ${Colors.BLACK};

  &:hover {
    background-color: transparent;
    border: 2px solid ${Colors.BLACK};
    color: ${Colors.BLACK};

    svg {
      path {
        fill: ${Colors.BLACK};
      }
    }
  }
`;

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
        <Button
          category={Category.secondary}
          size={Size.small}
          text="Learn more"
        />
        <StyledButton
          category={Category.primary}
          onClick={closeThemeBetaCard}
          size={Size.small}
          text="Got it"
          variant={Variant.success}
        />
      </div>
    </div>
  );
}
