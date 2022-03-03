import React from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";

import Checkbox from "components/ads/Checkbox";
import { ReactComponent as BetaIcon } from "assets/icons/menu/beta.svg";
import { ReactComponent as RightArrow } from "assets/icons/ads/arrow-right-line.svg";
import { ReactComponent as CloseIcon } from "assets/icons/control/close.svg";
import {
  closeOnboardingCardAction,
  setEnableReflowAction,
} from "actions/reflowActions";
import {
  getIsShowReflowCard,
  isReflowEnabled,
} from "selectors/widgetReflowSelectors";
import { setReflowBetaFlag } from "utils/storage";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  createMessage,
  REFLOW_BETA_CHECKBOX_LABEL,
  REFLOW_INFO_CARD_CONTENT_1,
  REFLOW_INFO_CARD_CONTENT_2,
  REFLOW_INFO_CARD_HEADER,
  REFLOW_LEARN_MORE,
} from "@appsmith/constants/messages";

import { getCurrentUser } from "selectors/usersSelectors";
import { User } from "constants/userConstants";

const ReflowBetaWrapper = styled.div`
  display: inline-flex;
  flex-direction: row;
  .beta-icon {
    width: 45px;
    height: 25px;
    rect {
      stroke: #191919;
    }
    path {
      fill: #191919;
    }
  }
`;
const ReflowBetaInfoCard = styled.div`
  display: flex;
  padding: 8px;
  flex-direction: row;
  color: #00407D;
  background: #E8F5FA;
  }
`;

const BulletList = styled.ul`
  list-style: inherit;
  list-style-position: outside;
  margin-left: 18px;
`;

const LearnMoreLink = styled.div`
  display: flex;
  align-items: center;
  width: fit-content;
  cursor: pointer;
  transition: transform 200ms;
  :hover {
    border-bottom: 1px solid #00407d;
    transform: scale(1.05);
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

const StyledRightArrow = styled(RightArrow)`
  fill: #00407d;
  path {
    fill: #00407d;
  }
`;

const BoldHeading = styled.h3`
  font-weight: 600;
  padding: 5px 0;
`;

export function ReflowBetaCard() {
  const dispatch = useDispatch();
  const user: User | undefined = useSelector(getCurrentUser);
  const shouldReflow = useSelector(isReflowEnabled);
  const shouldShowReflowCard = useSelector(getIsShowReflowCard);

  const openReflowDocs = () => {
    window.open(
      "https://docs.appsmith.com/core-concepts/designing-an-application",
      "_blank",
    );
  };

  const reflowBetaToggle = (isChecked: boolean) => {
    if (user?.email) {
      setReflowBetaFlag(user.email, isChecked);
    }
    dispatch(setEnableReflowAction(isChecked));
    AnalyticsUtil.logEvent("REFLOW_BETA_FLAG", {
      enabled: isChecked,
    });
  };

  const reflowCloseCard = () => {
    dispatch(closeOnboardingCardAction());
  };

  return (
    <>
      <ReflowBetaWrapper>
        <Checkbox
          isDefaultChecked={shouldReflow}
          label={createMessage(REFLOW_BETA_CHECKBOX_LABEL)}
          onCheckChange={reflowBetaToggle}
        />
        <BetaIcon className="beta-icon" />
      </ReflowBetaWrapper>
      {shouldShowReflowCard && (
        <ReflowBetaInfoCard>
          <div>
            <BoldHeading>{createMessage(REFLOW_INFO_CARD_HEADER)}</BoldHeading>
            <BulletList>
              <li>{createMessage(REFLOW_INFO_CARD_CONTENT_1)}</li>
              <li>{createMessage(REFLOW_INFO_CARD_CONTENT_2)}</li>
            </BulletList>
            <LearnMoreLink onClick={openReflowDocs}>
              <BoldHeading>{createMessage(REFLOW_LEARN_MORE)}</BoldHeading>
              <StyledRightArrow />
            </LearnMoreLink>
          </div>
          <StyledCloseIcon onClick={reflowCloseCard} />
        </ReflowBetaInfoCard>
      )}
    </>
  );
}
