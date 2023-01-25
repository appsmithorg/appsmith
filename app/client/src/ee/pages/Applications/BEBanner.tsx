import React from "react";
import { Button, Category, Size, Text, TextType } from "design-system-old";
import AppsmithImage from "assets/images/appsmith_logo_square.png";
import { useDispatch, useSelector } from "react-redux";
import { getRemainingDays } from "@appsmith/selectors/tenantSelectors";
import { setBEBanner } from "@appsmith/actions/tenantActions";
import {
  BE_TRIAL_BANNER_EXPIRY_MESSAGE,
  BE_WELCOME_MESSAGE,
  CLOSE,
  createMessage,
  NO_ACTIVE_SUBSCRIPTION,
  UPGRADE_NOW,
} from "@appsmith/constants/messages";
import { goToCustomerPortal } from "@appsmith/utils/billingUtils";
import {
  BannerWrapper,
  BannerContentWrapper,
  BannerTextWrapper,
  BannerCtaWrapper,
} from "./styles";

export function BEBanner() {
  const daysLeft = useSelector(getRemainingDays);
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(setBEBanner(false));
  };

  return (
    <BannerWrapper>
      <BannerContentWrapper>
        <img
          alt={createMessage(NO_ACTIVE_SUBSCRIPTION)}
          className="no-sub-img"
          height="200px"
          src={AppsmithImage}
          width="140px"
        />
        <BannerTextWrapper>
          <Text className="main-text" type={TextType.H1} weight="800">
            🚀 {createMessage(BE_WELCOME_MESSAGE)}
          </Text>
          <Text
            className="sub-text"
            dangerouslySetInnerHTML={{
              __html: createMessage(() =>
                BE_TRIAL_BANNER_EXPIRY_MESSAGE(daysLeft),
              ),
            }}
            type={TextType.P0}
            weight="700"
          />
        </BannerTextWrapper>
      </BannerContentWrapper>
      <BannerCtaWrapper>
        <Button
          className="upgrade-button"
          fill
          onClick={goToCustomerPortal}
          size={Size.large}
          tag="button"
          text={createMessage(UPGRADE_NOW)}
        />
        <Button
          category={Category.secondary}
          className="close-button"
          onClick={handleClose}
          size={Size.large}
          tag="button"
          text={createMessage(CLOSE)}
        />
      </BannerCtaWrapper>
    </BannerWrapper>
  );
}
