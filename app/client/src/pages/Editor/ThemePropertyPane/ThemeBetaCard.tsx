import React from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";

import { ReactComponent as CloseIcon } from "assets/icons/control/close.svg";
import { closeAppThemingBetaCard } from "actions/appThemingActions";
import {
  createMessage,
  APP_THEME_BETA_CARD_HEADING,
  APP_THEME_BETA_CARD_CONTENT,
} from "@appsmith/constants/messages";

import { getIsBetaCardShown } from "selectors/appThemingSelectors";

const ReflowBetaInfoCard = styled.div`
  display: flex;
  padding: 8px;
  flex-direction: row;
  color: #00407D;
  background: #E8F5FA;
  }
`;

const StyledCloseIcon = styled(CloseIcon)`
  width: 65px;
  fill: #1d9bd1;
  cursor: pointer;
  transition: transform 200ms;
  path {
    fill: #1d9bd1;
  }
  :hover {
    transform: scale(1.1);
    fill: #00407d;
    path {
      fill: #00407d;
    }
  }
`;

const BoldHeading = styled.h3`
  font-weight: 600;
  padding: 5px 0;
`;

export function ThemeBetaCard() {
  const dispatch = useDispatch();
  const shouldShowBetaCard = useSelector(getIsBetaCardShown);

  const closeThemeBetaCard = () => {
    dispatch(closeAppThemingBetaCard());
  };

  return (
    <div>
      {!shouldShowBetaCard && (
        <ReflowBetaInfoCard>
          <div>
            <BoldHeading>
              {createMessage(APP_THEME_BETA_CARD_HEADING)}
            </BoldHeading>
            <div>{createMessage(APP_THEME_BETA_CARD_CONTENT)}</div>
          </div>
          <StyledCloseIcon onClick={closeThemeBetaCard} />
        </ReflowBetaInfoCard>
      )}
    </div>
  );
}
