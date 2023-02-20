import React from "react";
import { Button, Category, Size, Text, TextType } from "design-system-old";
import { useDispatch, useSelector } from "react-redux";
import {
  getRemainingDays,
  isAdminUser,
} from "@appsmith/selectors/tenantSelectors";
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
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

export function BEBanner() {
  const { days, suffix } = useSelector(getRemainingDays);
  const dispatch = useDispatch();
  const isAdmin = useSelector(isAdminUser);

  const handleClose = () => {
    localStorage.setItem("showLicenseBanner", JSON.stringify(false));
    dispatch(setBEBanner(false));
  };

  return (
    <BannerWrapper>
      <BannerContentWrapper>
        <img
          alt={createMessage(NO_ACTIVE_SUBSCRIPTION)}
          className="no-sub-img"
          height="180px"
          src={`${ASSETS_CDN_URL}/upgrade-box.svg`}
          width="180px"
        />
        <BannerTextWrapper>
          <Text className="main-text" type={TextType.H1} weight="700">
            🚀 {createMessage(BE_WELCOME_MESSAGE)}
          </Text>
          <Text
            className="sub-text"
            dangerouslySetInnerHTML={{
              __html: createMessage(() =>
                BE_TRIAL_BANNER_EXPIRY_MESSAGE(days, suffix),
              ),
            }}
            type={TextType.P1}
            weight="600"
          />
        </BannerTextWrapper>
      </BannerContentWrapper>
      <BannerCtaWrapper>
        {isAdmin && (
          <Button
            className="upgrade-button"
            fill
            onClick={goToCustomerPortal}
            size={Size.medium}
            tag="button"
            text={createMessage(UPGRADE_NOW)}
          />
        )}
        <Button
          category={Category.secondary}
          className="close-button"
          onClick={handleClose}
          size={Size.medium}
          tag="button"
          text={createMessage(CLOSE)}
        />
      </BannerCtaWrapper>
    </BannerWrapper>
  );
}
